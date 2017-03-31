'use strict';

const escape = require('js-string-escape');

function render(errors) {
  return errors.map(error => `${error.line}:${error.column} - ${error.message} (${error.ruleId})`).join('\n');
}

function qunit(relativePath, errors, results) {
  let passed = hasPassed(results);
  let message = createAssertionMessage(relativePath, results);

  return `QUnit.module('ESLint | ${escape(relativePath)}');\n` +
    `QUnit.test('should pass ESLint', function(assert) {\n` +
    `  assert.expect(1);\n` +
    `  assert.ok(${passed}, '${escape(message)}');\n` +
    `});\n`;
}

function mocha(relativePath, errors, results) {
  let passed = hasPassed(results);
  let message = createAssertionMessage(relativePath, results);

  let output =
    `describe('ESLint | ${escape(relativePath)}', function() {\n` +
    `  it('should pass ESLint', function() {\n`;

  if (passed) {
    output +=
      `    // ESLint passed\n`;
  } else {
    output +=
      `    // ESLint failed\n` +
      `    var error = new chai.AssertionError('${escape(message)}');\n` +
      `    error.stack = undefined;\n` +
      `    throw error;\n`;
  }

  output +=
    `  });\n` +
    `});\n`;

  return output;
}

function hasPassed(results) {
  return !results.errorCount || results.errorCount.length === 0;
}

function createAssertionMessage(relativePath, results) {
  let message = `${relativePath} should pass ESLint`;

  if (results.messages) {
    message += `\n\n${render(results.messages)}`;
  }

  return message;
}

module.exports = { qunit, mocha };
