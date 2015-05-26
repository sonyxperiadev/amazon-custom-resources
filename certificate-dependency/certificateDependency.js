'use strict';

function certificateDependency(properties, callback) {
  if (!properties.CertificateName)
    callback("CertificateName not specified");

  var aws = require("aws-sdk");
  var iam = new aws.IAM();

  var responseData = {};
  console.log('certificateDependency', properties);
  iam.listServerCertificates({}, function(err, data) {
    console.log('getServerCertificate', err, data);
    if (err)
      return callback(err);

    var regex = new RegExp('^' + properties.CertificateName + '$');
    var matching = data.ServerCertificateMetadataList.filter(function(cert) {
      return cert.ServerCertificateName.match(regex);
    });
    if (matching.length != 1) {
      var names = matching.map(function(cert) {
        return cert.ServerCertificateName;
      });
      var message = 'Exactly one matching certificate is allowed: ' +
        names.length + ' ' + names.join();
      return callback(new Error(message));
    }
    var match = matching[0];
    callback(null, match);
  });
}

certificateDependency.handler = function(event, context) {
  console.log(JSON.stringify(event, null, '  '));

  if (event.RequestType == 'Delete') {
    return sendResponse(event, context, "SUCCESS");
  }

  certificateDependency(event.ResourceProperties, function(err, result) {
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


module.exports = certificateDependency;

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
  certificateDependency(data, function(err, res) {
    console.log("Result", err, res);
  });
}

function usageExit() {
  var path = require('path');
  console.error('Usage: '  + path.basename(process.argv[1]) + ' json-array');
  process.exit(1);
}
