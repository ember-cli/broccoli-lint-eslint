const escape = require('js-string-escape');

function render(errors) {
  return errors.map(error => `${error.line}:${error.column} - ${error.message} (${error.ruleId})`).join('\n');
}

function qunit(relativePath, errors, results) {
  const passed = !results.errorCount || results.errorCount.length === 0;

  let messages = relativePath + ' should pass ESLint';

  if (results.messages) {
    messages += '\n\n' + render(results.messages);
  }

  return `QUnit.module('ESLint | ${escape(relativePath)}');\n` +
    `QUnit.test('should pass ESLint', function(assert) {\n` +
    `  assert.expect(1);\n` +
    `  assert.ok(${passed}, '${escape(messages)}');\n` +
    `});\n`;
}

function mocha(relativePath, errors, results) {
  const passed = !results.errorCount || results.errorCount.length === 0;

  let messages = `${relativePath} should pass ESLint`;

  if (results.messages) {
    messages += `\n\n${render(results.messages)}`;
  }

  let output =
    `describe('ESLint | ${escape(relativePath)}', function() {\n` +
    `  it('should pass ESLint', function() {\n`;

  if (passed) {
    output +=
      `    // ESLint passed\n`;
  } else {
    output +=
      `    // ESLint failed\n` +
      `    var error = new chai.AssertionError('${escape(messages)}');\n` +
      `    error.stack = undefined;\n` +
      `    throw error;\n`;
  }

  output +=
    `  });\n` +
    `});\n`;

  return output;
}

module.exports = {qunit, mocha};
