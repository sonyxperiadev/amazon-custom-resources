'use strict';

var bluebird = require('bluebird');
var _ = require('lodash');
var fs = bluebird.promisifyAll(require('fs'));

var download = require('./download');
var extractFileFromTarball = require('./extract-file-from-tarball');
var createConfigFile = require('./create-config-file');
var insertFileInZip = require('./insert-file-in-zip');

function logDownload(s3Region, s3Bucket, s3Key) {
  var msg = 'Starting download of ' + s3Key + ' in bucket ' + s3Bucket;
  if (s3Region) {
    msg += ' in region ' + s3Region;
  }
  console.log(msg);
}

module.exports = function getZipWithConfigAsBuffer(properties) {
  if (typeof properties.Code !== 'object') {
    return bluebird.reject('Mandatory Code resource property is missing');
  }

  var s3Region = properties.Code.S3Region;
  var s3Bucket = properties.Code.S3Bucket;
  var s3Key = properties.Code.S3Key;

  var hashIndex = s3Key.indexOf('#');
  var afterDownload = _.identity;
  if (hashIndex >= 0) {
    var tarFilePath = s3Key.substring(hashIndex + 1);
    afterDownload = function (tarFile) {
      return extractFileFromTarball(tarFile, tarFilePath);
    };
    s3Key = s3Key.substring(0, hashIndex);
  }

  logDownload(s3Region, s3Bucket, s3Key);
  return bluebird.all([
      download(s3Region, s3Bucket, s3Key).then(afterDownload),
      createConfigFile(properties.Config)
    ])
    .then(_.spread(insertFileInZip))
    .then(fs.readFileAsync);
};
