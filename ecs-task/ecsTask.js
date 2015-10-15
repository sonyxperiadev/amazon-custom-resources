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
  if (!properties.Name)
    return callback("Name not specified");

  console.log('ecsTask', properties);
  var options = {
    image: properties.Image,
    name: properties.Name,
    envFiles: properties.EnvFiles
  };
  registerTaskDefinition(options, function(err, taskDefinition) {
    if (err) return callback(err);
    return callback(null, toOutputs(taskDefinition));
  });
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



function registerTaskDefinition(options, callback) {
  var localEnv = [{ name: 'STATSD_HOST', value: 'dockerhost' }];
  var envs = options.envFiles.map(envFileToEnvironment);
  var environment = localEnv.concat.apply(envs[0], envs[1]);
  console.log('environment', environment);
  options.environment = environment;
  findFreePort(function(err, port) {
    options.port = port;
    var params = getTaskDefinitionParams(options);
    console.log('registerTaskDefinition', params.containerDefinitions[0]);
    ecs.registerTaskDefinition(params, function(err, data) {
      if (err)
        console.log(err, err.stack);
      else
        console.log(data);
      callback(err, data.taskDefinition);
    });
  });
}

function getTaskDefinitionParams(options) {
  var params = {
    containerDefinitions: [
      {
        environment: options.environment,
        essential: true,
        extraHosts: [{
          hostname: 'dockerhost',
          ipAddress: '172.14.42.1'
        }],
        image: options.image,
        memory: 512,
        name: options.name,
        logConfiguration: {
          logDriver: 'json-file',
          options: {
            "max-size": "128m",
            "max-file": "8"
          }
        },
        portMappings: [
          {
            containerPort: 80,
            hostPort: options.port,
          },
        ]
      }
    ],
    family: options.name
  };

  if (aws.VERSION < '2.2.9') {
    console.log('Trimming extraHosts and logConfiguration due to old Node Version < 2.2.9', aws.VERSION);
    delete params.containerDefinitions[0].extraHosts;
    delete params.containerDefinitions[0].logConfiguration;
  }

  return params;
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

function findFreePort(callback) {
  var randomPort = Math.floor(Math.random() * 32000) + 32000;
  process.nextTick(callback.bind(null, null, randomPort));
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
