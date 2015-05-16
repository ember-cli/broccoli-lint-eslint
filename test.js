'use strict';
var assert = require('assert'),
  fs = require('fs'),
  rimraf = require('rimraf');

afterEach(function () {
  rimraf.sync('temp');
  rimraf.sync('broccoli-build.out');
});

it('should reported errors', function () {
  var buildLog = fs.readFileSync('broccoli-build.out').toString();

  assert(buildLog.indexOf('Strings must use doublequote.') !== -1, 'Used eslint validation - strings');
  assert(buildLog.indexOf('is not in camel case') !== -1, 'Used eslint validation - camel case');
  assert(buildLog.indexOf('testing custom rules') !== -1, 'Used custom rulesdir rules');
  assert(buildLog.indexOf('fixture/1.js') !== -1, 'Shows filepath');
});
