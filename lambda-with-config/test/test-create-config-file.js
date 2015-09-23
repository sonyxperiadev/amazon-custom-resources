'use strict';

var bluebird = require('bluebird');
var fs = bluebird.promisifyAll(require('fs'));
var expect = require('chai').expect;

var createConfigFile = require('../lib/create-config-file');

describe('createConfigFile', function () {
  it('writes the JSON', function () {
    return createConfigFile({
      foo: 'bar'
    })
    .then(fs.readFileAsync)
    .then(function (buffer) {
      expect(buffer.toString()).to.equal('{"foo":"bar"}');
    });
  });
});
