'use strict';

var bluebird = require('bluebird');
var rp = require('request-promise');
var _ = require('lodash');

function CloudFormationResponse(event, context) {
  this.event = event;
  this.context = context;
  this._hasResponded = false;
}

CloudFormationResponse.prototype._send = function (data) {
  if (this._hasResponded) {
    console.log('CloudFormationResponse already sent, ignoring all subsequent sends.');
    return bluebird.resolve();
  }
  this._hasResponded = true;

  var responseBody = _.assign({
    StackId: this.event.StackId,
    RequestId: this.event.RequestId,
    LogicalResourceId: this.event.LogicalResourceId,
    PhysicalResourceId: this.event.PhysicalResourceId
  }, data);

  console.log('CloudFormationResponse:\n', JSON.stringify(responseBody));

  return rp.put({
    uri: this.event.ResponseURL,
    body: responseBody,
    json: true,
    headers: {
      'content-type': ''
    }
  }).then(this.context.succeed).catch(this.context.fail);
};

CloudFormationResponse.prototype.success = function (data) {
  this.clearTimeout();

  console.error('SUCCESS', data);
  return this._send({
    Status: 'SUCCESS',
    Data: data
  });
};

CloudFormationResponse.prototype.failed = function (err) {
  this.clearTimeout();

  console.error('ERROR', err.message, err.stack);
  return this._send({
    Status: 'FAILED',
    Reason: err.message + ' (See details in CloudWatch Log: ' + this.context.logStreamName + ')'
  });
};

CloudFormationResponse.prototype.timeout = function (milliseconds) {
  this.clearTimeout();

  var self = this;
  console.log('Custom timeout is ', milliseconds, 'ms');
  self._timeout = setTimeout(function () {
    self.failed(new Error(
      'The function took too long to execute, custom timeout triggered!'));
  }, milliseconds);
};

CloudFormationResponse.prototype.clearTimeout = function () {
  if (this._timeout) {
    clearTimeout(this._timeout);
  }
};

module.exports = CloudFormationResponse;
