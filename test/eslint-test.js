'use strict';

const path = require('path');
const expect = require('./chai').expect;
const co = require('co');
const testHelpers = require('broccoli-test-helper');
const eslint = require('..');

const ESLint = eslint;
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

  it('exports a static immutable "testGenerators" list', function() {
    expect(eslint.testGenerators).to.deep.equal(['qunit', 'mocha']);

    eslint.testGenerators.push('jest');

    expect(eslint.testGenerators).to.deep.equal(['qunit', 'mocha']);
  });

  it('logs errors to the console (using factory function)', co.wrap(function *() {
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
      .to.contain(`b.js: line 1, col 5, Warning - 'foo' is assigned a value but never used. (no-unused-vars)\n`)
      .to.contain(`DEPRECATION: Please use the create() factory method`);
  }));

  it('accept many:* node if eslintrc specifies overrides', co.wrap(function*() {
    // we need to create two temp folders with eslintrc files in it
    const firstDirectory = yield createTempDir();
    const secondDirectory = yield createTempDir();

    firstDirectory.write({
      '.eslintrc.js': `module.exports = { rules: { 'no-console': 'error'}, overrides: [ { files: 'a.js', rules: { 'no-console': 'disable' } }] }`,
      'a.js': `console.log('foo');\n`,
    });

    secondDirectory.write({
      '.eslintrc.js': `module.exports = { }`,
      'a.js': `console.log('foo');\n`,
    });

    let messages = [];
    let console = {
      log(message) {
        messages.push(message);
      },
    };

    const mergedDirectories = new MergeTrees([
      firstDirectory.path(),
      secondDirectory.path(),
    ]);

    expect(() => new ESLint(mergedDirectories, { console })).to.not.throw();

    yield firstDirectory.dispose();
    yield secondDirectory.dispose();
  }));

  it('logs errors to the console (using new)', co.wrap(function *() {
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

    output = createBuilder(new ESLint(input.path(), { format, console }));

    yield output.build();

    expect(messages.join(''))
      .to.contain(`a.js: line 1, col 1, Error - Unexpected console statement. (no-console)\n`)
      .to.contain(`b.js: line 1, col 5, Warning - 'foo' is assigned a value but never used. (no-unused-vars)\n`)
      .to.contain(`DEPRECATION: Please use the create() factory method`);
  }));

  it('logs errors to the console (using create() factory method)', co.wrap(function *() {
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

    output = createBuilder(ESLint.create(input.path(), { format, console }));

    yield output.build();

    expect(messages.join(''))
      .to.contain(`a.js: line 1, col 1, Error - Unexpected console statement. (no-console)\n`)
      .to.contain(`b.js: line 1, col 5, Warning - 'foo' is assigned a value but never used. (no-unused-vars)\n`)
      .to.not.contain(`DEPRECATION: Please use the create() factory method`);
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

  it('should lint typescript files if ts extension is added', co.wrap(function *() {
    input.write({
      '.eslintrc.js': `module.exports = { rules: { 'no-unused-vars': 'error' } };\n`,
      'a.ts': `var foo = 5;\n`
    });
    let format = 'eslint/lib/formatters/compact';

    let messages = [];
    let console = {
      log(message) {
        messages.push(message);
      }
    };

    output = createBuilder(eslint(input.path(), { format, console, extensions: ['ts'] }));

    yield output.build();

    expect(messages.join('\n')).to.contain(`a.ts: line 1, col 5, Error - 'foo' is assigned a value but never used. (no-unused-vars)\n`);
  }));

  describe('testGenerator', function() {
    it('qunit: generates QUnit tests', co.wrap(function *() {
      input.write({
        '.eslintrc.js': `module.exports = { rules: { 'no-console': 'error', 'no-unused-vars': 'warn' } };\n`,
        'a.js': `console.log('foo');\n`,
        'b.js': `var foo = 5;\n`,
      });

      output = createBuilder(ESLint.create(input.path(), { console, testGenerator: 'qunit' }));

      yield output.build();

      let result = output.read();
      expect(Object.keys(result)).to.deep.equal(['.eslintrc.lint-test.js', 'a.lint-test.js', 'b.lint-test.js']);
      expect(result['a.lint-test.js'].trim()).to.equal([
        `QUnit.module('ESLint | a.js');`,
        `QUnit.test('should pass ESLint', function(assert) {`,
        `  assert.expect(1);`,
        `  assert.ok(false, 'a.js should pass ESLint\\n\\n1:1 - Unexpected console statement. (no-console)');`,
        `});`,
      ].join('\n'));
    }));

    it('mocha: generates Mocha tests', co.wrap(function *() {
      input.write({
        '.eslintrc.js': `module.exports = { rules: { 'no-console': 'error', 'no-unused-vars': 'warn' } };\n`,
        'a.js': `console.log('foo');\n`,
        'b.js': `var foo = 5;\n`,
      });

      output = createBuilder(ESLint.create(input.path(), { console, testGenerator: 'mocha' }));

      yield output.build();

      let result = output.read();
      expect(Object.keys(result)).to.deep.equal(['.eslintrc.lint-test.js', 'a.lint-test.js', 'b.lint-test.js']);
      expect(result['a.lint-test.js'].trim()).to.equal([
        `describe('ESLint | a.js', function() {`,
        `  it('should pass ESLint', function() {`,
        `    // test failed`,
        `    var error = new chai.AssertionError('a.js should pass ESLint\\n\\n1:1 - Unexpected console statement. (no-console)');`,
        `    error.stack = undefined;`,
        `    throw error;`,
        `  });`,
        `});`,
      ].join('\n'));
    }));

    it('custom: generates tests via custom test generator function', co.wrap(function *() {
      input.write({
        '.eslintrc.js': `module.exports = { rules: { 'no-console': 'error', 'no-unused-vars': 'warn' } };\n`,
        'a.js': `console.log('foo');\n`,
        'b.js': `var foo = 5;\n`,
      });

      let args = [];
      function testGenerator() {
        args.push(arguments);
      }

      output = createBuilder(ESLint.create(input.path(), { console, testGenerator }));

      yield output.build();

      expect(args).to.have.lengthOf(3);
      expect(args[0][0]).to.equal('.eslintrc.js');
      expect(args[1][0]).to.equal('a.js');
      expect(args[2][0]).to.equal('b.js');

      let results = args[1][2];
      expect(results.filePath).to.match(/a\.js$/);
      delete results.filePath;

      expect(results).to.deep.equal({
        'errorCount': 1,
        'fixableErrorCount': 0,
        'fixableWarningCount': 0,
        'messages': [{
          'column': 1,
          'endColumn': 12,
          'endLine': 1,
          'line': 1,
          'message': 'Unexpected console statement.',
          'nodeType': 'MemberExpression',
          'ruleId': 'no-console',
          'severity': 2,
          'source': 'console.log(\'foo\');',
        }],
        'source': 'console.log(\'foo\');\n',
        'warningCount': 0,
      });
    }));
  });

  describe('group', function() {
    it('qunit: generates a single QUnit module', co.wrap(function *() {
      input.write({
        '.eslintrc.js': `module.exports = { rules: { 'no-console': 'error', 'no-unused-vars': 'warn' } };\n`,
        'a.js': `console.log('foo');\n`,
        'b.js': `var foo = 5;\n`,
      });

      output = createBuilder(eslint.create(input.path(), { console, testGenerator: 'qunit', group: 'app' }));

      yield output.build();

      let result = output.read();
      expect(Object.keys(result)).to.deep.equal(['app.lint-test.js']);
      expect(result['app.lint-test.js'].trim()).to.equal([
        `QUnit.module('ESLint | app');`,
        ``,
        `QUnit.test('a.js', function(assert) {`,
        `  assert.expect(1);`,
        `  assert.ok(false, 'a.js should pass ESLint\\n\\n1:1 - Unexpected console statement. (no-console)');`,
        `});`,
        ``,
        `QUnit.test('b.js', function(assert) {`,
        `  assert.expect(1);`,
        `  assert.ok(true, 'b.js should pass ESLint\\n\\n1:5 - \\'foo\\' is assigned a value but never used. (no-unused-vars)');`,
        `});`,
      ].join('\n'));
    }));

    it('grouping tolerates removal of files (GH: ember-cli/ember-cli#7347)', co.wrap(function *() {
      let result;
      input.write({
        '.eslintrc.js': `module.exports = { rules: { 'no-console': 'error', 'no-unused-vars': 'warn' } };\n`,
        'foo': {
          'a.js': `console.log('foo');\n`,
          'b.js': `var foo = 5;\n`,
        }
      });

      output = createBuilder(eslint.create(input.path(), { console, testGenerator: 'qunit', group: 'app' }));

      yield output.build();

      result = output.read();
      expect(Object.keys(result)).to.deep.equal(['app.lint-test.js']);
      expect(result['app.lint-test.js'].trim()).to.equal([
        `QUnit.module('ESLint | app');`,
        ``,
        `QUnit.test('foo/a.js', function(assert) {`,
        `  assert.expect(1);`,
        `  assert.ok(false, 'foo/a.js should pass ESLint\\n\\n1:1 - Unexpected console statement. (no-console)');`,
        `});`,
        ``,
        `QUnit.test('foo/b.js', function(assert) {`,
        `  assert.expect(1);`,
        `  assert.ok(true, 'foo/b.js should pass ESLint\\n\\n1:5 - \\'foo\\' is assigned a value but never used. (no-unused-vars)');`,
        `});`,
      ].join('\n'));

      input.write({
        '.eslintrc.js': `module.exports = { rules: { 'no-console': 'error', 'no-unused-vars': 'warn' } };\n`,
        foo: {
          'a.js': `console.log('foo');\n`,
          'b.js': null,
        }
      });

      yield output.build();

      result = output.read();
      expect(Object.keys(result)).to.deep.equal(['app.lint-test.js']);
      expect(result['app.lint-test.js'].trim()).to.equal([
        `QUnit.module('ESLint | app');`,
        ``,
        `QUnit.test('foo/a.js', function(assert) {`,
        `  assert.expect(1);`,
        `  assert.ok(false, 'foo/a.js should pass ESLint\\n\\n1:1 - Unexpected console statement. (no-console)');`,
        `});`,
      ].join('\n'));
    }));

    it('mocha: generates a single Mocha test suite', co.wrap(function *() {
      input.write({
        '.eslintrc.js': `module.exports = { rules: { 'no-console': 'error', 'no-unused-vars': 'warn' } };\n`,
        'a.js': `console.log('foo');\n`,
        'b.js': `var foo = 5;\n`,
      });

      output = createBuilder(eslint.create(input.path(), { console, testGenerator: 'mocha', group: 'app' }));

      yield output.build();

      let result = output.read();
      expect(Object.keys(result)).to.deep.equal(['app.lint-test.js']);
      expect(result['app.lint-test.js'].trim()).to.equal([
        `describe('ESLint | app', function() {`,
        ``,
        `  it('a.js', function() {`,
        `    // test failed`,
        `    var error = new chai.AssertionError('a.js should pass ESLint\\n\\n1:1 - Unexpected console statement. (no-console)');`,
        `    error.stack = undefined;`,
        `    throw error;`,
        `  });`,
        ``,
        `  it('b.js', function() {`,
        `    // test passed`,
        `  });`,
        ``,
        `});`,
      ].join('\n'));
    }));
  });

  describe('throwOnError', function() {
    it('throw an error for the first encountered error', co.wrap(function *() {
      input.write({
        '.eslintrc.js': `module.exports = { rules: { 'no-console': 'error' } };\n`,
        'a.js': `console.log('foo');\n`,
      });

      output = createBuilder(ESLint.create(input.path(), { console, throwOnError: true }));

      yield expect(output.build()).to.be.rejectedWith('rules violation with `error` severity level');
    }));

    it('does not throw errors for warning', co.wrap(function *() {
      input.write({
        '.eslintrc.js': `module.exports = { rules: { 'no-console': 'warn' } };\n`,
        'a.js': `console.log('foo');\n`,
      });

      output = createBuilder(ESLint.create(input.path(), { console, throwOnError: true }));

      yield expect(output.build()).to.be.fulfilled;
    }));

    it('does not throw errors for disabled rules', co.wrap(function *() {
      input.write({
        '.eslintrc.js': `module.exports = { rules: { 'no-console': 'off' } };\n`,
        'a.js': `console.log('foo');\n`,
      });

      output = createBuilder(ESLint.create(input.path(), { console, throwOnError: true }));

      yield expect(output.build()).to.be.fulfilled;
    }));
  });

  describe('throwOnWarn', function() {
    it('throw an error for the first encountered error', co.wrap(function *() {
      input.write({
        '.eslintrc.js': `module.exports = { rules: { 'no-console': 'error' } };\n`,
        'a.js': `console.log('foo');\n`,
      });

      output = createBuilder(ESLint.create(input.path(), { console, throwOnWarn: true }));

      yield expect(output.build()).to.be.rejectedWith('rules violation with `error` severity level');
    }));

    it('throw an error for the first encountered warning', co.wrap(function *() {
      input.write({
        '.eslintrc.js': `module.exports = { rules: { 'no-console': 'warn' } };\n`,
        'a.js': `console.log('foo');\n`,
      });

      output = createBuilder(ESLint.create(input.path(), { console, throwOnWarn: true }));

      yield expect(output.build()).to.be.rejectedWith('rules violation with `warn` severity level');
    }));

    it('does not throw errors for disabled rules', co.wrap(function *() {
      input.write({
        '.eslintrc.js': `module.exports = { rules: { 'no-console': 'off' } };\n`,
        'a.js': `console.log('foo');\n`,
      });

      output = createBuilder(ESLint.create(input.path(), { console, throwOnWarn: true }));

      yield expect(output.build()).to.be.fulfilled;
    }));
  });

  describe('.eslintignore', function() {
    // this doesn't seem to work... :(
    it.skip('excludes files from being linted', co.wrap(function *() {
      input.write({
        '.eslintrc.js': `module.exports = { rules: { 'no-console': 'error', 'no-unused-vars': 'warn' } };\n`,
        '.eslintignore': `a.js\n`,
        'a.js': `console.log('foo');\n`,
        'b.js': `var foo = 5;\n`,
      });

      output = createBuilder(ESLint.create(input.path(), { console, testGenerator: 'qunit' }));

      yield output.build();

      let result = output.read();
      expect(Object.keys(result)).to.deep.equal([
        '.eslintignore',
        '.eslintrc.lint-test.js',
        'b.lint-test.js',
      ]);
    }));
  });
});
