'use strict';

var aws = require("aws-sdk");
var kms = new aws.KMS();

function kmsKey(properties, callback) {
  if (!properties.Description) {
    callback("Description not specified");
  }
  kms.createKey({Description: properties.Description}, function(err, data) {
    if (err) callback(err, null);
    else callback(null, {KeyId: data.KeyMetadata.KeyId, Arn: data.KeyMetadata.Arn});
  });
}

function kmsKeyDescribe(keyId, callback) {
  kms.describeKey({KeyId: keyId}, function(err, data) {
    if (err) callback(err, {KeyId: keyId});
    else callback(null, {KeyId: data.KeyMetadata.KeyId, Arn: data.KeyMetadata.Arn});
  });
}

function kmsKeyDisable(keyId, callback) {
  var params = {
    KeyId: keyId
  };
  kms.disableKey(params, function(err, data) {
    if (err) callback(err, params);
    else callback(null, params);
  });
}

kmsKey.handler = function(event, context) {
  console.log(JSON.stringify(event, null, '  '));

  if (event.RequestType == 'Update') {
    kmsKeyDescribe(event.PhysicalResourceId, function(err, result) {
      var status = err ? 'FAILED' : 'SUCCESS';
      return sendResponse(event, context, status, result, err);
    });
  }
  if (event.RequestType == 'Delete') {
    kmsKeyDisable(event.PhysicalResourceId, function(err, result) {
      var status = err ? 'FAILED' : 'SUCCESS';
      return sendResponse(event, context, status, result, err);
    });
  } else {
    kmsKey(event.ResourceProperties, function(err, result) {
      var status = err ? 'FAILED' : 'SUCCESS';
      return sendResponse(event, context, status, result, err);
    });
  }
};

function getReason(err) {
  if (err)
    return err.message;
  else
    return '';
}


function sendResponse(event, context, status, data, err) {
  var physicalResourceId = context.logStreamName;
  if (data && data.KeyId) {
    physicalResourceId = data.KeyId;
  }
  var responseBody = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: physicalResourceId,
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


module.exports = kmsKey;

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
  echoDependency(data, function(err, res) {
    console.log("Result", err, res);
  });
}

function usageExit() {
  var path = require('path');
  console.error('Usage: '  + path.basename(process.argv[1]) + ' json-array');
  process.exit(1);
}
