'use strict';

function vpcDependency(properties, callback) {
  if (!properties.VpcName)
    callback("VpcName not specified");

  var aws = require("aws-sdk");
  var ec2 = new aws.EC2();

  var responseData = {};
  console.log('vpcDependency', properties);
  ec2.describeVpcs({}, function(err, data) {
    console.log('describeVpcs', err, data);
    if (err)
      return callback(err);

    var vpcs = data.Vpcs;
    var matching = vpcs.filter(function(vpc) {
      if (properties.VpcName === 'default') {
        return vpc.IsDefault
      } else {
        var matchingTags = vpc.Tags.filter(function(tag) {
          return tag.Key === 'Name' && tag.Value === properties.VpcName;
        });
        return matchingTags.length > 0;
      }
    });
    console.log('matching', matching)
    if (matching.length != 1)
      return callback('Exactly one matching vpc is allowed ' + matching);
    var match = matching[0];
    delete match.Tags;
    var filters = [{Name: 'vpc-id', Values: [match.VpcId] }];
    if (properties.OnlyDefaultSubnets)
      filters.push({Name: 'default-for-az', Values: ['true']});
    var params = {Filters: filters};
    ec2.describeSubnets(params, function(err, data) {
      console.log('Subnets', params, data);
      var subnetIds = [];
      data.Subnets.forEach(function(subnet, i) {
        match['SubnetId' + i] = subnet.SubnetId;
        subnetIds.push(subnet.SubnetId);
      });
      match.SubnetIds = subnetIds.join(',');
      return callback(null, match);
    });
  });
}

vpcDependency.handler = function(event, context) {
  console.log(JSON.stringify(event, null, '  '));

  vpcDependency(event.ResourceProperties, function(err, result) {
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
    PhysicalResourceId: 'vpcDependency-' + event.ResourceProperties.VpcName,
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


module.exports = vpcDependency;

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
  vpcDependency(data, function(err, res) {
    console.log("Result", err, res);
  });
}

function usageExit() {
  var path = require('path');
  console.error('Usage: '  + path.basename(process.argv[1]) + ' json-array');
  process.exit(1);
}
