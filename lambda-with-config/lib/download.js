'use strict';

var bluebird = require('bluebird');
var fs = bluebird.promisifyAll(require('fs'));
var tmp = bluebird.promisifyAll(require('tmp'));
var aws = require('aws-sdk');

module.exports = function download(s3Region, s3Bucket, s3Key) {
  var config = {};
  if (s3Region) {
    config.region = s3Region;
  }
  var s3 = bluebird.promisifyAll(new aws.S3(config));
  return tmp.fileAsync().then(function (result) {
    var tmpFile = result[0];
    return s3.getObjectAsync({
      Bucket: s3Bucket,
      Key: s3Key
    }).then(function (data) {
      return fs.writeFileAsync(tmpFile, data.Body);
    }).then(function () {
      return tmpFile;
    });
  });
};
