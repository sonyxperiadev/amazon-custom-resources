'use strict';

var aws = require('aws-sdk');
var _ = require('lodash');
var Promise = require('bluebird');
var uuid = require('node-uuid');
var crypto = require('crypto');

var lambda = new aws.Lambda();
lambda.invokeAsync = null;
lambda = Promise.promisifyAll(lambda);

var CloudFormationResponse = require('./lib/cloud-formation-response');
var getZipWithConfigAsBuffer = require('./lib/get-zip-with-config-as-buffer');

function generateUniqueFunctionName(event) {
  var stackName = event.StackId.split(':')[5].split('/')[1];
  var name = stackName + '-' + event.LogicalResourceId + '-' + crypto.pseudoRandomBytes(6).toString('hex');
  return name.substring(0, 64);
}

function createLambda(event) {
  // Generate a unique function name
  event.PhysicalResourceId = generateUniqueFunctionName(event);
  console.log('Creating lambda', event.PhysicalResourceId);

  return getZipWithConfigAsBuffer(event.ResourceProperties).then(function (code) {
    console.log('Got zip with config');
    var properties = _.assign({
        Code: {
          ZipFile: code
        },
        FunctionName: event.PhysicalResourceId
      },
      _.omit(event.ResourceProperties, ['ServiceToken', 'Config', 'Code', 'FunctionName', 'ModifiedDate']));

    return lambda.createFunctionAsync(properties);
  });
}

function isFunctionNotFoundError(err) {
  return err.message && err.message.indexOf('Function not found') >= 0;
}

function deleteLambda(event) {
  console.log('Deleting lambda', event.PhysicalResourceId);
  return lambda.deleteFunctionAsync({
    FunctionName: event.PhysicalResourceId
  }).catch(isFunctionNotFoundError, function () {
    console.log('Function not found, ignoring.');
  });
}

function updateLambda(event) {
  console.log('Updating lambda', event.PhysicalResourceId);
  return getZipWithConfigAsBuffer(event.ResourceProperties).then(function (code) {
    return lambda.updateFunctionCodeAsync({
      ZipFile: code,
      FunctionName: event.PhysicalResourceId
    }).then(function() {
        var properties = _.assign({
            FunctionName: event.PhysicalResourceId
        }, _.omit(event.ResourceProperties, ['ServiceToken', 'Config', 'Code', 'FunctionName', 'ModifiedDate']));
        console.log('updating function with properties', properties);
        return lambda.updateFunctionConfigurationAsync(properties);
    }).catch(isFunctionNotFoundError, function () {
        // Should it fail or try create? Should only happen if the resource was deleted
        // outside of CF and this could provide away of actually restore it properly
        console.log('Function not found during update, trying to create it instead.');
        return createLambda(event);
    })
  });
}

module.exports.createLambda = createLambda;
module.exports.updateLambda = updateLambda;
module.exports.deleteLambda = deleteLambda;

module.exports.handler = function(event, context) {
  console.log('EVENT', JSON.stringify(event));

  var response = new CloudFormationResponse(event, context);

  var onSuccess = response.success.bind(response);
  var onFailed = response.failed.bind(response);

  response.timeout(55 * 1000);

  switch (event.RequestType) {
    case 'Delete':
      deleteLambda(event).then(onSuccess).catch(onFailed);
      return;
    case 'Update':
      updateLambda(event).then(onSuccess).catch(onFailed);
      return;
    default:
      createLambda(event).then(onSuccess).catch(onFailed);
      return;
  }
};

console.log('lambdaWithConfig loaded');
