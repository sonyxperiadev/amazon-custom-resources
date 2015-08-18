'use strict';

function stackDependency(properties, callback) {
  if (!properties.StackName)
    callback("Stack name not specified");
  var excludes = properties.Excludes || [];

  var aws = require("aws-sdk");
  var cfn = new aws.CloudFormation();

  var responseData = {};
  console.log('stackDependency', properties);
  cfn.describeStacks({StackName: properties.StackName}, function(err, data) {
    console.log('describeStacks', err, data);
    if (err)
      return callback(err);

    var environmentVars = [];
    data.Stacks[0].Outputs.forEach(function(output) {
      if (excludes.indexOf(output.OutputKey) != -1) return;
      responseData[output.OutputKey] = output.OutputValue;
      environmentVars.push(output.OutputKey + '=' + output.OutputValue);
    });
    if (excludes.indexOf('Environment') == -1)
      responseData.Environment = environmentVars.join('\n');
    return callback(null, responseData);
  });
}

stackDependency.handler = function(event, context) {
  console.log(JSON.stringify(event, null, '  '));

  if (event.RequestType == 'Delete') {
    return sendResponse(event, context, "SUCCESS");
  }

  stackDependency(event.ResourceProperties, function(err, result) {
    var status = err ? 'FAILED' : 'SUCCESS';
    return sendResponse(event, context, status, result, err);
  });
};

function getReason(err) {
  if (err)
    return err.message;
  else
    return '';
}

function sendResponse(event, context, status, data, err) {
  var responseBody = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: context.logStreamName,
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


module.exports = stackDependency;

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
  stackDependency(data, function(err, res) {
    console.log("Result", err, res);
  });
}

function usageExit() {
  var path = require('path');
  console.error('Usage: '  + path.basename(process.argv[1]) + ' json-array');
  process.exit(1);
}
