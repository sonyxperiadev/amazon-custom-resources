'use strict';

var aws = require("aws-sdk");
var sns = new aws.SNS();

function getReason(err) {
  if (err)
    return err.message;
  else
    return '';
}

function createSubscription(event, callback) {
  var params = {
    TopicArn: event.ResourceProperties.TopicArn,
    Endpoint: event.ResourceProperties.Endpoint,
    Protocol: event.ResourceProperties.Protocol
  };
  sns.subscribe(params, function(err, result) {
    if (err) {
      callback(err);
    } else {
      callback(null, result.SubscriptionArn);
    }
  });
}

function deleteSubscription(event, callback) {
  var params = {
    SubscriptionArn: event.PhysicalResourceId
  };
  sns.unsubscribe(params, function(err) {
    if (err) {
      callback(err);
    } else {
      callback(null, event.PhysicalResourceId);
    }
  });
}

function updateSubscription(event, callback) {
  deleteSubscription(event, function(err) {
    if (err) {
      callback(err);
    } else {
      createSubscription(event, callback);
    }
  });
}

module.exports.handler = function(event, context) {
  console.log(JSON.stringify(event, null, '  '));
  var callback = function(err, subscriptionArn) {
    var status = err ? 'FAILED' : 'SUCCESS';
    var responseBody = {
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      Status: status,
      Reason: getReason(err) + " See details in CloudWatch Log: " + context.logStreamName
    };
    if (subscriptionArn) {
      responseBody.PhysicalResourceId = subscriptionArn;
      responseBody.Data = {
        SubscriptionArn: subscriptionArn
      };
    } else {
      responseBody.PhysicalResourceId = event.PhysicalResourceId;
    }

    console.log("RESPONSE:\n", responseBody);
    return sendResponse(event, context, responseBody);
  };
  if (!event.ResourceProperties.TopicArn) callback("TopicArn not specified");
  if (!event.ResourceProperties.Protocol) callback("Protocol not specified");
  if (!event.ResourceProperties.Endpoint) callback("Endpoint not specified");
  switch (event.RequestType) {
    case 'Delete':
      deleteSubscription(event, callback);
      return;
    case 'Update':
      updateSubscription(event, callback);
      return;
    default:
      createSubscription(event, callback);
      return;
  }
};

function sendResponse(event, context, responseBody) {
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
    context.done(null, responseBody.Data);
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
