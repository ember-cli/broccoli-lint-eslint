'use strict';

const path = require('path');
const expect = require('./chai').expect;
const co = require('co');
const testHelpers = require('broccoli-test-helper');
const eslint = require('..');

const createBuilder = testHelpers.createBuilder;
const createTempDir = testHelpers.createTempDir;

describe('broccoli-lint-eslint', function() {
  let input, output, console;

  beforeEach(co.wrap(function *() {
    input = yield createTempDir();
    console = {
      log(line) {},
    };
  }));

  afterEach(co.wrap(function *() {
    yield input.dispose();
    if (output) {
      yield output.dispose();
    }
  }));

  it('logs errors to the console', co.wrap(function *() {
    input.write({
      '.eslintrc.js': `module.exports = { rules: { 'no-console': 'error', 'no-unused-vars': 'warn' } };\n`,
      'a.js': `console.log('foo');\n`,
      'b.js': `var foo = 5;\n`,
    });

    let format = 'eslint/lib/formatters/compact';

    let messages = [];
    let console = {
      log(message) {
        messages.push(message);
      }
    };

    output = createBuilder(eslint(input.path(), { format, console }));

    yield output.build();

    expect(messages.join(''))
      .to.contain(`a.js: line 1, col 1, Error - Unexpected console statement. (no-console)\n`)
      .to.contain(`b.js: line 1, col 5, Warning - 'foo' is assigned a value but never used. (no-unused-vars)\n`);
  }));


  it('does not generate test files by default', co.wrap(function *() {
    input.write({
      '.eslintrc.js': `module.exports = { rules: { 'no-console': 'error', 'no-unused-vars': 'warn' } };\n`,
      'a.js': `console.log('foo');\n`,
      'b.js': `var foo = 5;\n`,
    });

    output = createBuilder(eslint(input.path(), { console }));

    yield output.build();

    expect(Object.keys(output.read())).to.deep.equal(['.eslintrc.js', 'a.js', 'b.js']);
  }));
});
