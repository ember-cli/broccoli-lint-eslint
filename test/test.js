const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

afterEach(function afterEach() {
  rimraf.sync('temp');
  rimraf.sync('broccoli-build.out');
});

it('should reported errors', function shouldReportErrors() {
  const buildLog = fs.readFileSync('broccoli-build.out').toString();
  const NOT_FOUND = -1;

  assert(buildLog.indexOf('Strings must use doublequote.') !== NOT_FOUND, 'Used eslint validation - strings');
  assert(buildLog.indexOf('is not in camel case') !== NOT_FOUND, 'Used eslint validation - camel case');
  assert(buildLog.indexOf('testing custom rules') !== NOT_FOUND, 'Used custom rulesdir rules');
  assert(buildLog.indexOf('fixture/1.js') !== NOT_FOUND, 'Shows filepath');
});
