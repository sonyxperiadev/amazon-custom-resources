'use strict';

var bluebird = require('bluebird');
var tmp = bluebird.promisifyAll(require('tmp'));
var fs = bluebird.promisifyAll(require('fs'));
var path = require('path');

module.exports = function createConfigFile(config) {
  return tmp.dirAsync().then(function (results) {
    var outputDir = results[0];
    var outputFile = path.join(outputDir, 'config.json');
    return fs.writeFileAsync(outputFile, JSON.stringify(config)).then(function () {
      return outputFile;
    });
  });
};
