// Creates a signed S3 PUT URL.

'use strict';

var bluebird = require('bluebird');
var aws = require('aws-sdk');
var s3 = bluebird.promisifyAll(new aws.S3());

var params = {Bucket: 'll-debug', Key: 'lambda-with-config-response.json'};
s3.getSignedUrlAsync('putObject', params).then(console.log).catch(console.error);
