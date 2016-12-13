'use strict';

const immutable = require('object-path-immutable');
const crypto = require('crypto');
const aws = require("aws-sdk");
const Promise = require('bluebird');

const findSubnets = require('./lib/create-subnets');
const findNATGateway = require('./lib/create-nat-gateway');
const findInternetGateway = require('./lib/create-internet-gateway');
const findNATRouteTable = require('./lib/create-nat-route-table');
const findIGWRouteTable = require('./lib/create-igw-route-table');

const generateUniqueFunctionName = (event) => {
  const stackName = event.StackId.split(':')[5].split('/')[1];
  const name = stackName + '-' + event.LogicalResourceId + '-' + crypto.pseudoRandomBytes(6).toString('hex');
  return name.substring(0, 64);
};

const vpcNATGatewayDependecy = (event, callback) => {
  if (event.RequestType === 'Create') {
    event.PhysicalResourceId = generateUniqueFunctionName(event);
  }
  const initialState = {
    properties: event.ResourceProperties,
    callback: callback
  };

  return findSubnets(initialState)
    .then(findNATGateway)
    .then(findInternetGateway)
    .then(findNATRouteTable)
    .then(findIGWRouteTable)
    .then(result => result.callback(null, result))
    .catch(err => {
      return initialState.callback(err);
    });
};

const deleteLambda = event => {
    console.log('Deleting lambda', event.PhysicalResourceId);
    return lambda.deleteFunctionAsync({
        FunctionName: event.PhysicalResourceId
    }).catch(isFunctionNotFoundError, function () {
        console.log('Function not found, ignoring.');
    });
};


vpcNATGatewayDependecy.handler = (event, context) => {
    console.log(JSON.stringify(event, null, '  '));

    if (event.RequestType == 'Delete') {
        return sendResponse(event, context, "SUCCESS");
    }

    vpcNATGatewayDependecy(event, function(err, result) {
        var status = err ? 'FAILED' : 'SUCCESS';
        return sendResponse(event, context, status, result, err);
    });
};

module.exports = vpcNATGatewayDependecy;

const getReason = err => err ? err.message : '';

const sendResponse = (event, context, status, data, err) => {
    const responseBody = {
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        PhysicalResourceId: event.PhysicalResourceId,
        Status: status,
        Reason: getReason(err) + " See details in CloudWatch Log: " + context.logStreamName,
        Data: data
    };

    console.log("RESPONSE:\n", responseBody);
    const json = JSON.stringify(responseBody);

    const https = require("https");
    const url = require("url");

    const parsedUrl = url.parse(event.ResponseURL);
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: "PUT",
        headers: {
            "content-type": "",
            "content-length": json.length
        }
    };

    let request = https.request(options, response => {
        console.log("STATUS: " + response.statusCode);
        console.log("HEADERS: " + JSON.stringify(response.headers));
        context.done(null, data);
    });

    request.on("error", error => {
        console.log("sendResponse Error:\n", error);
        context.done(error);
    });

    request.on("end", () => {
        console.log("end");
    });
    request.write(json);
    request.end();
};

if(require.main === module) {
    console.log("called directly");
    if (process.argv.length < 3)
        usageExit();
    try {
        const data = JSON.parse(process.argv[2]);
    } catch (error) {
        console.error('Invalid JSON', error);
        usageExit();
    }
    vpcNATGatewayDependecy(data, (err, res) => {
        console.log("Result", err, res);
    });
}

const usageExit = () => {
    var path = require('path');
    console.error('Usage: '  + path.basename(process.argv[1]) + ' json-array');
    process.exit(1);
};

