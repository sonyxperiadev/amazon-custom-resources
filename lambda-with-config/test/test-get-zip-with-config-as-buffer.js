'use strict';

var bluebird = require('bluebird');
var fs = bluebird.promisifyAll(require('fs'));
var tmp = bluebird.promisifyAll(require('tmp'));
var path = require('path');
var mockery = require('mockery');
var NodeZip = require('node-zip');
var expect = require('chai').expect;

function fixtureDownloader(region, bucket, key) {
  return tmp.dirAsync().then(function (results) {
    return results[0];
  }).then(function (dir) {
    var file = path.join(dir, key);
    return fs.linkAsync(path.join(__dirname, 'fixtures', key), file).then(function () {
      return file;
    });
  });
}

function ensureZipContainsConfig(config) {
  return function (buffer) {
    var zip = new NodeZip(buffer, {});
    if (!zip.files.hasOwnProperty('config.json')) {
      return bluebird.reject(new Error('Zip file does not have config'));
    }
    var actualContents = zip.files['config.json']._data.getContent().toString();
    expect(JSON.parse(actualContents)).to.deep.equal(config);
  };
}

describe('getZipWithConfigAsBuffer', function () {

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false
    });
  });

  after(function () {
    mockery.enable();
  });

  function withMocks() {
    mockery.registerMock('./download', fixtureDownloader);
    return require('../lib/get-zip-with-config-as-buffer');
  }

  var fooBarConfig = {
    foo: 'bar'
  };

  it('handles zip archives on S3', function () {
    var getZipWithConfigAsBuffer = withMocks();
    return getZipWithConfigAsBuffer({
      Code: {
        S3Bucket: 'foo',
        S3Key: 'fixture.zip'
      },
      Config: fooBarConfig
    }).then(ensureZipContainsConfig(fooBarConfig));
  });

  it('handles zip archives inside tar archives on S3', function () {
    var getZipWithConfigAsBuffer = withMocks();
    return getZipWithConfigAsBuffer({
      Code: {
        S3Bucket: 'foo',
        S3Key: 'fixture.tgz#fixture.zip'
      },
      Config: fooBarConfig
    }).then(ensureZipContainsConfig(fooBarConfig));
  });
});
