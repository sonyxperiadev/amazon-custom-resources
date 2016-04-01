'use strict';

var bluebird = require('bluebird');
var exec = bluebird.promisify(require('child_process').exec);
var path = require('path');

module.exports = function insertFileInZip(zipFile, file) {
  return exec('which zip').then(function (data) {
    return data[0].replace('\n', '');
  }).catch(function () {
    return path.join(__dirname, '..', 'bin', 'zip');
  }).then(function (zipBin) {
    var cmd = zipBin + ' -j ' + zipFile + ' ' + file;
    return exec(cmd).then(function () {
      return zipFile;
    });
  });
};
