'use strict';

function imageDependency(properties, callback) {
  if (!properties.ImageName)
    callback("ImageName not specified");

  var aws = require("aws-sdk");
  var ec2 = new aws.EC2();

  var responseData = {};
  console.log('imageDependency', properties);
  var params = { ExecutableUsers: ['self'], Filters: [
    {Name: 'name', Values: [ properties.ImageName ] }
  ]};
  ec2.describeImages(params, function(err, data) {
    console.log('describeImages', err, data);
    if (err)
      return callback(err);

    var matching = data.Images;
    console.log('matching', matching)
    if (matching.length != 1)
      return callback('Exactly one matching image is allowed ' + matching);
    var match = matching[0];
    delete match.ProductCodes;
    delete match.BlockDeviceMappings;
    match.Tags = match.Tags.join(',');
    callback(null, match);
  });
}

imageDependency.handler = function(event, context) {
  console.log(JSON.stringify(event, null, '  '));

  if (event.RequestType == 'Delete' || event.RequestType == 'Update') {
    return sendResponse(event, context, "SUCCESS");
  }

  imageDependency(event.ResourceProperties, function(err, result) {
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


module.exports = imageDependency;

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
  imageDependency(data, function(err, res) {
    console.log("Result", err, res);
  });
}

function usageExit() {
  var path = require('path');
  console.error('Usage: '  + path.basename(process.argv[1]) + ' json-array');
  process.exit(1);
}
