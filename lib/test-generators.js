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

qunit.testOnly = function(relativePath, errors, results) {
  let passed = hasPassed(results);
  let message = createAssertionMessage(relativePath, results);

  return `QUnit.test('${escape(relativePath)}', function(assert) {\n` +
    `  assert.expect(1);\n` +
    `  assert.ok(${passed}, '${escape(message)}');\n` +
    `});\n`;
};

qunit.header = function(group) {
  return `QUnit.module('ESLint | ${escape(group)}');\n`;
};

qunit.footer = function() {
  return '';
};

function mocha(relativePath, errors, results) {
  let passed = hasPassed(results);
  let message = createAssertionMessage(relativePath, results);

  return (
    `describe('ESLint | ${escape(relativePath)}', function() {\n` +
    `  it('should pass ESLint', function() {\n` +
    mochaAssertion(passed, message) +
    `  });\n` +
    `});\n`
  );
}

mocha.testOnly = function(relativePath, errors, results) {
  let passed = hasPassed(results);
  let message = createAssertionMessage(relativePath, results);

  return (
    `  it('${escape(relativePath)}', function() {\n` +
    mochaAssertion(passed, message) +
    `  });\n`
  );
};

mocha.header = function(group) {
  return `describe('ESLint | ${escape(group)}', function() {\n`;
};

mocha.footer = function() {
  return '});\n';
};

function mochaAssertion(passed, message) {
  if (passed) {
    return `    // ESLint passed\n`;
  }

  return (
      `    // ESLint failed\n`+
      `    var error = new chai.AssertionError('${escape(message)}');\n` +
      `    error.stack = undefined;\n` +
      `    throw error;\n`
  );
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
