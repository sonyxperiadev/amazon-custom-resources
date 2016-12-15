'use strict';

const crypto = require('crypto');
const R = require('ramda');

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

    const createVpcResources = R.composeP(findIGWRouteTable, findNATRouteTable, findInternetGateway, findNATGateway, findSubnets);
    return createVpcResources(initialState)
        .then(result => result.callback(null, result))
        .catch(err => initialState.callback(err));
};

const getReason = err => err ? err.message : '';

const sendResponse = (event, context, status, data, err) => {
    const responseBody = {
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        PhysicalResourceId: event.PhysicalResourceId,
        Status: status,
        Reason: getReason(err) + ' See details in CloudWatch Log: ' + context.logStreamName,
        Data: data
    };

    console.log('RESPONSE:\n', responseBody);
    const json = JSON.stringify(responseBody);

    const https = require('https');
    const url = require('url');

    const parsedUrl = url.parse(event.ResponseURL);
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'PUT',
        headers: {
            'content-type': '',
            'content-length': json.length
        }
    };

    const request = https.request(options, function(response) {
        console.log('STATUS: ' + response.statusCode);
        console.log('HEADERS: ' + JSON.stringify(response.headers));
        context.done(null, data);
    });

    request.on('error', function(error) {
        console.log('sendResponse Error:\n', error);
        context.done(error);
    });

    request.on('end', function() {
        console.log('end');
    });
    request.write(json);
    request.end();
};

vpcNATGatewayDependecy.handler = (event, context) => {
    console.log(JSON.stringify(event, null, '  '));

    if (event.RequestType == 'Delete') {
        return sendResponse(event, context, 'SUCCESS');
    }

    vpcNATGatewayDependecy(event, function(err, result) {
        const status = err ? 'FAILED' : 'SUCCESS';
        return sendResponse(event, context, status, result, err);
    });
};

module.exports = vpcNATGatewayDependecy;


const usageExit = () => {
    const path = require('path');
    console.error('Usage: ' + path.basename(process.argv[1]) + ' json-array');
    process.exit(1); //eslint-disable-line no-process-exit
};

if(require.main === module) {
    console.log('called directly');
    if (process.argv.length < 3)
        usageExit();
    try {
        const data = JSON.parse(process.argv[2]);   //eslint-disable-line no-unused-vars
    } catch (error) {
        console.error('Invalid JSON', error);
        usageExit();
    }

    vpcNATGatewayDependecy(data, (err, res) => {    //eslint-disable-line no-undef
        console.log('Result', err, res);
    });
}

