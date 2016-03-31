'use strict';

var bluebird = require('bluebird');
var tmp = bluebird.promisifyAll(require('tmp'));
var exec = bluebird.promisify(require('child_process').exec);

module.exports = function extractFileFromTarball(tarFile, archiveFile) {
  return tmp.fileAsync().then(function (results) {
    var outputFile = results[0];
    var cmd = 'tar -O -xzf ' + tarFile + ' ' + archiveFile + ' > ' + outputFile;
    return exec(cmd).then(function () {
      return outputFile;
    });
  });
};
