'use strict';

var aws = require('aws-sdk');
var parseArgs = require('minimist');

console.log('SDK', aws.VERSION);

if(require.main === module) {
  var sonyAwsProxyConfig = require('sony-aws-proxy-config');
  aws.config.update(sonyAwsProxyConfig());
}
var ecs = new aws.ECS({region: 'eu-west-1'});
var elb = new aws.ELB({region: 'eu-west-1'});

function ecsTask(properties, callback) {
  var mappedHostPort, mappedContainerPort;
  if (!properties.containerDefinitions)
    return callback("containerDefinitions not specified");

  console.log('ecsTask', properties);
  delete properties.ServiceToken;
  properties.family = properties.containerDefinitions[0].name;
  properties.containerDefinitions.forEach(function(def) {
    if (def.envFiles) {
      var envs = def.envFiles.map(envFileToEnvironment);
      var environment = def.environment || [];
      environment = environment.concat.apply(environment, envs);
      def.environment = environment;
      def.essential = (def.essential === true || def.essential === 'true')
      delete def.envFiles;
    }
    if (def.cliOptions) {
      var options = parseCliOptions(def.cliOptions);
      def.portMappings =  (def.portMappings||[]).concat(options.portMappings);
      delete def.cliOptions;
    }
    if (def.portMappings) {
      def.portMappings.forEach(function(mapping) {
        if (mapping.hostPort == 80) {
          if (mappedHostPort)
            throw new Error('Only one hostPort can use 80');
          mappedHostPort = findFreePort();
          mapping.hostPort = mappedHostPort;
          mappedContainerPort = mapping.containerPort;
        }
      });
    }
    console.log('def', def);
  });
  console.log('registerTaskDefinition', properties.containerDefinitions[0]);
  ecs.registerTaskDefinition(properties, function(err, response) {
    if (err) {
      console.log(err, err.stack);
      return callback(err);
    }
    console.log(response);
    callback(err, toOutputs(response.taskDefinition,
                            mappedHostPort, mappedContainerPort));
  });
}

function envFileToEnvironment(envFile) {
  if (!envFile) return [];
  var lines = envFile.split('\n');
  var env = lines.map(function(line) {
    var nameValue = line.split('=');
    if (!nameValue[0]) return null;
    return {
      name: nameValue[0],
      value: nameValue[1]
    };
  });
  return env.filter(function(pair) {
    return pair;
  });
}

function findFreePort() {
  // TODO make sure that the port is actually free.
  var randomPort = Math.floor(Math.random() * 32000) + 32000;
  //process.nextTick(callback.bind(null, null, randomPort));
  return randomPort;
}

function parseCliOptions(options) {
  var args = parseArgs(options.split(' '));
  var options = {}
  options.portMappings = toPortMapping(toArray(args.p, args.publish));
  return options;
}

function toArray() {
  var args = [];
  for (var i=0; i < arguments.length; i++) {
    var arg = arguments[i];
    console.log(arg);
    if (Array.isArray(arg))
      args = args.concat(arg);
    else
      args.push(arg)
  }
  return args;
}

function toPortMapping(pms) {
  var portMappings = pms.map(function(pm) {
    if (!pm) return null;
    var a = pm.split(':');
    return { hostPort: a[0], containerPort: a[1] };
  });
  return portMappings.filter(function(f) {return f});
}

function ecsTaskRemove(properties, callback) {
  console.log('ecsTaskRemove', properties);
  var options = {
    taskDefinition: properties.Name
  };
  ecs.describeTaskDefinition(options, function(err, response) {
    if (err) return callback(null, err); // Don't fail remove ever
    var options = {
      taskDefinition: response.taskDefinition.taskDefinitionArn
    };
    ecs.deregisterTaskDefinition(options, function(err, response) {
      if (err) return callback(null, err); // Don't fail remove ever
      return callback(null, toOutputs(response.taskDefinition));
    });
  });
}

function toOutputs(taskDefinition, hostPort, containerPort) {
  return {
    Family: taskDefinition.family,
    Revision: taskDefinition.revision,
    TaskDefinitionArn: taskDefinition.taskDefinitionArn,
    HostPort: hostPort,
    ContainerPort: containerPort
  }
}


function getReason(err) {
  if (err && err.message)
    return err.message;
  else if (err)
    return err;
  else
    return '';
}


function sendResponse(event, context, status, data, err) {
  var responseBody = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: 'ecsTask-' + ((data && data.TaskDefinitionArn)
      || event.ResourceProperties.Image),
    Status: status,
    Reason: getReason(err) + " See details in CloudWatch Log: " + context.logStreamName,
    Data: data
  };

  console.log("RESPONSE:\n", responseBody);
  var json = JSON.stringify(responseBody);

  var https = require("https");
  var url = require("url");

  var parsedUrl = url.parse(event.ResponseURL);
  var options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: "PUT",
    headers: {
      "content-type": "",
      "content-length": json.length
    }
  };

  var request = https.request(options, function(response) {
    console.log("STATUS: " + response.statusCode);
    console.log("HEADERS: " + JSON.stringify(response.headers));
    context.done(null, data);
  });

  request.on("error", function(error) {
    console.log("sendResponse Error:\n", error);
    context.done(error);
  });

  request.on("end", function() {
    console.log("end");
  });
  request.write(json);
  request.end();
}

ecsTask.handler = function(event, context) {
  console.log(JSON.stringify(event, null, '  '));
  console.log(JSON.stringify(context, null, '  '));

  if (event.RequestType == 'Delete') {
    ecsTaskRemove(event.ResourceProperties, function(err, result) {
      var status = err ? 'FAILED' : 'SUCCESS';
      return sendResponse(event, context, status, result, err);
    });
  } else {
    ecsTask(event.ResourceProperties, function(err, result) {
      var status = err ? 'FAILED' : 'SUCCESS';
      return sendResponse(event, context, status, result, err);
    });
  }
};

module.exports = ecsTask;

if(require.main === module) {
  console.log("called directly");
  if (process.argv.length < 3)
    usageExit();
  try {
    var data = JSON.parse(process.argv[2]);
  } catch (error) {
    console.error('Invalid JSON', error);
    usageExit();
  }
  if (process.argv[3] == 'delete') {
    ecsTaskRemove(data, function(err, res) {
      console.log("Result", err, res);
    });
  } else {
    ecsTask(data, function(err, res) {
      console.log("Result", err, res);
    });
  }
}

function usageExit() {
  var path = require('path');
  console.error('Usage: '  + path.basename(process.argv[1]) + ' json-array');
  process.exit(1);
}
