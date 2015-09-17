'use strict';

function elasticacheDependency(properties, callback) {
  if (!properties.CacheId)
    callback("CacheId not specified");

  var AWS = require("aws-sdk");
  var elasticache = new AWS.ElastiCache();

  var responseData = {};
  console.log('elasticacheDependency', properties);
  var params = { CacheClusterId: properties.CacheId, ShowCacheNodeInfo: true };
  elasticache.describeCacheClusters(params, function(err, data) {
    console.log('describeCacheClusters', err, data);
    if (err)
      return callback(err);

    var matching = data.CacheClusters;
    console.log('matching', require('util').inspect(matching, false, null))
    if (matching.length != 1)
      return callback('Exactly one matching CacheCluster is allowed ' + matching);
    var match = formatData(matching[0]);
    callback(null, match);
  });
}

function formatData(data) {
    delete data.PendingModifiedValues;
    delete data.CacheSecurityGroups;
    delete data.CacheParameterGroup;
    delete data.SecurityGroups;
    var endpoints = []
    data.CacheNodes.forEach(function(node, i) {
      var endpoint = node.Endpoint.Address + ':' + node.Endpoint.Port;
      data['CacheNodeEndpoint' + i] = endpoint;
      data['CacheNodeEndpointAddress' + i] = node.Endpoint.Address;
      data['CacheNodeEndpointPort' + i] = node.Endpoint.Port;
      endpoints.push(endpoint);
    });
    data.CacheNodeEndpoints = endpoints.join(',');
    delete data.CacheNodes;
    return data;
}

elasticacheDependency.handler = function(event, context) {
  console.log(JSON.stringify(event, null, '  '));

  if (event.RequestType == 'Delete') {
    return sendResponse(event, context, "SUCCESS");
  }

  elasticacheDependency(event.ResourceProperties, function(err, result) {
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
    PhysicalResourceId: 'elasticacheDependency-' + event.ResourceProperties.CacheId,
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


module.exports = elasticacheDependency;

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
  elasticacheDependency(data, function(err, res) {
    console.log("Result", err, res);
  });
}

function usageExit() {
  var path = require('path');
  console.error('Usage: '  + path.basename(process.argv[1]) + ' json-array');
  process.exit(1);
}
