const expect = require('chai').expect;
const testGenerators = require('../build/test-generators');

const FAIL = {
  errorCount: 1,
  messages: [{
    line: 42,
    column: 13,
    message: 'This is not a valid foo',
    ruleId: 'validate-foo',
  }, {
    line: 123,
    column: 1,
    message: 'foobar',
    ruleId: 'comma-dangle',
  }],
};

describe('test-generators', function() {
  describe('qunit', function() {
    before(function() {
      this.generate = testGenerators.qunit;
    });

    it('generates passing test for missing errorCount', function() {
      expect(this.generate('some/file.js', null, {}).trim()).to.equal(`
QUnit.module('ESLint | some/file.js');
QUnit.test('should pass ESLint', function(assert) {
  assert.expect(1);
  assert.ok(true, 'some/file.js should pass ESLint');
});`.trim());
    });

    it('generates passing test for errorCount == 0', function() {
      expect(this.generate('some/file.js', null, { errorCount: 0 }).trim()).to.equal(`
QUnit.module('ESLint | some/file.js');
QUnit.test('should pass ESLint', function(assert) {
  assert.expect(1);
  assert.ok(true, 'some/file.js should pass ESLint');
});`.trim());
    });

    it('generates passing test for errorCount == 1', function() {
      expect(this.generate('some/file.js', null, { errorCount: 1 }).trim()).to.equal(`
QUnit.module('ESLint | some/file.js');
QUnit.test('should pass ESLint', function(assert) {
  assert.expect(1);
  assert.ok(false, 'some/file.js should pass ESLint');
});`.trim());
    });

    it('renders error messages', function() {
      expect(this.generate('some/file.js', null, FAIL).trim()).to.equal(`
QUnit.module('ESLint | some/file.js');
QUnit.test('should pass ESLint', function(assert) {
  assert.expect(1);
  assert.ok(false, 'some/file.js should pass ESLint\\n\\n42:13 - This is not a valid foo (validate-foo)\\n123:1 - foobar (comma-dangle)');
});`.trim());
    });
  });

  describe('mocha', function() {
    before(function() {
      this.generate = testGenerators.mocha;
    });

    it('generates passing test for missing errorCount', function() {
      expect(this.generate('some/file.js', null, {}).trim()).to.equal(`
describe('ESLint | some/file.js', function() {
  it('should pass ESLint', function() {
    // ESLint passed
  });
});`.trim());
    });

    it('generates passing test for errorCount == 0', function() {
      expect(this.generate('some/file.js', null, { errorCount: 0 }).trim()).to.equal(`
describe('ESLint | some/file.js', function() {
  it('should pass ESLint', function() {
    // ESLint passed
  });
});`.trim());
    });

    it('generates passing test for errorCount == 1', function() {
      expect(this.generate('some/file.js', null, { errorCount: 1 }).trim()).to.equal(`
describe('ESLint | some/file.js', function() {
  it('should pass ESLint', function() {
    // ESLint failed
    var error = new chai.AssertionError('some/file.js should pass ESLint');
    error.stack = undefined;
    throw error;
  });
});`.trim());
    });

    it('renders error messages', function() {
      expect(this.generate('some/file.js', null, FAIL).trim()).to.equal(`
describe('ESLint | some/file.js', function() {
  it('should pass ESLint', function() {
    // ESLint failed
    var error = new chai.AssertionError('some/file.js should pass ESLint\\n\\n42:13 - This is not a valid foo (validate-foo)\\n123:1 - foobar (comma-dangle)');
    error.stack = undefined;
    throw error;
  });
});`.trim());
    });
  });
});
