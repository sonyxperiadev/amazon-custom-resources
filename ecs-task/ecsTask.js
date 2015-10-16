'use strict';

var aws = require('aws-sdk');

console.log('SDK', aws.VERSION);

if(require.main === module) {
  var sonyAwsProxyConfig = require('sony-aws-proxy-config');
  aws.config.update(sonyAwsProxyConfig());
}
var ecs = new aws.ECS({region: 'eu-west-1'});
var elb = new aws.ELB({region: 'eu-west-1'});

function ecsTask(properties, callback) {
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
      delete def.envFiles;
      if (def.portMappings) {
        def.portMappings.forEach(function(mapping) {
          if (mapping.hostPort == 0)
            mapping.hostPort = findFreePort();
        });
      }
      if (aws.VERSION < '2.2.9') {
        console.log('Trimming extraHosts and logConfiguration due to old Node Version < 2.2.9', aws.VERSION);
        delete properties.containerDefinitions[0].extraHosts;
        delete properties.containerDefinitions[0].logConfiguration;
      }
    }
  });
  console.log('registerTaskDefinition', properties.containerDefinitions[0]);
  ecs.registerTaskDefinition(properties, function(err, response) {
    if (err)
      console.log(err, err.stack);
    else
      console.log(response);
    callback(err, toOutputs(response.taskDefinition));
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
  var randomPort = Math.floor(Math.random() * 32000) + 32000;
  //process.nextTick(callback.bind(null, null, randomPort));
  return randomPort;
}



function ecsTaskRemove(properties, callback) {
  console.log('ecsTaskRemove', properties);
  if (!properties.Name)
    return callback("Name not specified");
  var options = {
    taskDefinition: properties.Name
  };
  ecs.describeTaskDefinition(options, function(err, response) {
    if (err) return callback(err);
    var options = {
      taskDefinition: response.taskDefinition.taskDefinitionArn
    };
    ecs.deregisterTaskDefinition(options, function(err, response) {
      if (err) return callback(err);
      return callback(null, toOutputs(response.taskDefinition));
    });
  });
}

function toOutputs(taskDefinition) {
  return {
    Family: taskDefinition.family,
    Revision: taskDefinition.revision,
    TaskDefinitionArn: taskDefinition.taskDefinitionArn,
    HostPort: taskDefinition.containerDefinitions[0].portMappings[0].hostPort
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
    PhysicalResourceId: event.PhysicalResourceId ||
      (data && 'ecsTask-' + data.TaskDefinitionArn) ||
        event.ResourceProperties.Image,
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
      err = null;
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
