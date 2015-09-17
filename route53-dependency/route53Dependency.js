'use strict';

function route53Dependency(properties, callback) {
  if (!properties.DomainName)
    callback("Domain name not specified");

  var aws = require("aws-sdk");
  var route53 = new aws.Route53();

  var responseData = {};
  console.log('route53Dependency', properties);
  route53.listHostedZones({}, function(err, data) {
    console.log('listHostedZones', err, data);
    if (err)
      return callback(err);

    var zones = data.HostedZones;
    var matching = zones.filter(function(zone) {
      return zone.Name == properties.DomainName + '.';
    });
    if (matching.length != 1)
      return callback('Exactly one matching zone is allowed ' + zones);
    var match = matching[0];
    delete match.Config;
    delete match.CallerReference;
    match.Id = match.Id.split('/')[2];
    match.Name = match.Name.substring(0, match.Name.length-1);
    return callback(null, match);
  });
}

route53Dependency.handler = function(event, context) {
  console.log(JSON.stringify(event, null, '  '));

  if (event.RequestType == 'Delete') {
    return sendResponse(event, context, "SUCCESS");
  }

  route53Dependency(event.ResourceProperties, function(err, result) {
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
    PhysicalResourceId: 'route53Dependency-' + event.ResourceProperties.DomainName,
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


module.exports = route53Dependency;

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
  route53Dependency(data, function(err, res) {
    console.log("Result", err, res);
  });
}

function usageExit() {
  var path = require('path');
  console.error('Usage: '  + path.basename(process.argv[1]) + ' json-array');
  process.exit(1);
}
