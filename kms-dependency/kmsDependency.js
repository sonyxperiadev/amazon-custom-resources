'use strict';

var AWS = require('aws-sdk');
var kms = new AWS.KMS({
    region: process.env.REGION || process.env.AWS_DEFAULT_REGION
});

function kmsDependency(properties, callback) {
      var value = properties.EncryptedValue;

      if (!value) {
        process.nextTick(callback.bind(null,{err:'No field EncryptedValue found'}));
      }

      if (value.substring(0, 4) === 'kms:') {
          return decryptText(value.substring(4), callback);
      } else if (value.substring(0, 5) === 'kmsb:'){
          return decryptBinary(value.substring(5), callback);
      } else {
        console.log("Could not find prefix kms: or kmsb: simply returning the value as is")
        process.nextTick(callback.bind(null, null, value));
      }
}

function decryptBinary(value, callback) {
    var params = {CiphertextBlob: new Buffer(value, 'base64')};
    return kms.decrypt(params, function(err, response) {
        if (err) return callback(err);
        return callback(null, response.Plaintext);
    });
}

function decryptText(value, callback) {
    return decryptBinary(value, function(err, reply) {
        if (err) return callback(err);
        return callback(null, reply.toString('utf8'));
    });
}

kmsDependency.handler = function(event, context) {
  console.log(JSON.stringify(event, null, '  '));

  if (event.RequestType == 'Delete') {
    return sendResponse(event, context, "SUCCESS");
  }

  kmsDependency(event.ResourceProperties, function(err, result) {
    var status = err ? 'FAILED' : 'SUCCESS';
    return sendResponse(event, context, status, {DecryptedValue : result}, err);
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
    PhysicalResourceId: 'kmsDependency-' + JSON.stringify(event.ResourceProperties),
    Status: status,
    Reason: getReason(err) + " See details in CloudWatch Log: " + context.logStreamName,
  };
    console.log("RESPONSE:\n", responseBody);

    // Set decrypted value after we have printed it
  responseBody.Data = data

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


module.exports = kmsDependency;

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
  kmsDependency(data, function(err, res) {
    console.log("Result", err, res);
  });
}

function usageExit() {
  var path = require('path');
  console.error('Usage: '  + path.basename(process.argv[1]) + ' json-array');
  process.exit(1);
}
