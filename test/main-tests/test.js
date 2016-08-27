const fs = require('fs');
const path = require('path');
const { expect } = require('../chai');
const sinon = require('sinon');
const { mv } = require('broccoli-stew');
const { UnwatchedDir } = require('broccoli-source');
const MergeTrees = require('broccoli-merge-trees');

const eslint = require('../../');
const runEslint = require('../helpers/run-eslint');

const RULE_TAG_CAMELCASE = '(camelcase)';
const RULE_TAG_NO_CONSOLE = '(no-console)';
const MESSAGE_DOUBLEQUOTE = 'Strings must use doublequote.';
const MESSAGE_CUSTOM_RULES = 'testing custom rules';
const MESSAGE_IGNORED_FILE_REGEXP = /(?:File ignored by default\.)|(?:File ignored because of a matching ignore pattern\.)/;

const FIXTURES_PATH = 'test/main-tests/fixtures';
const FIXTURES_PATH_ESLINTIGNORE = path.resolve(process.cwd(), './test/main-tests/fixtures/.eslintignore');
const FIXTURES_PATH_ESLINTRC = path.join(FIXTURES_PATH, '.eslintrc.js');
const FIXTURE_FILE_PATH_ALERT = 'fixtures/alert.js';
const JS_FIXTURES = fs.readdirSync(FIXTURES_PATH).filter((name) => /\.js$/.test(name));


describe('EslintValidationFilter', function describeEslintValidationFilter() {
  this.timeout(60000);

  before(function beforeEslintValidationFilter() {
    this.setupSpies = function setupSpies() {
      // spy on filter process methods
      const processStringSpy = this.sinon.spy(eslint.prototype, 'processString');
      const postProcessSpy = this.sinon.spy(eslint.prototype, 'postProcess');

      return { processStringSpy, postProcessSpy };
    };
  });

  beforeEach(function beforeEachAndEvery() {
    this.sinon = sinon.sandbox.create();
  });

  afterEach(function afterEachAndEvery() {
    this.sinon.restore();
  });

  function shouldReportErrors(inputNode, options) {
    return function _shouldReportErrors() {
      // lint test fixtures
      const promise = runEslint(inputNode, options);

      return promise.then(function assertLinting({buildLog}) {
        expect(buildLog, 'Used eslint validation').to.have.string(RULE_TAG_NO_CONSOLE);
        expect(buildLog, 'Shows filepath').to.have.string(FIXTURE_FILE_PATH_ALERT);
        expect(buildLog, 'Used relative config - console not allowed').to.have.string(RULE_TAG_NO_CONSOLE);
        expect(buildLog, 'Used relative config - single quotes').to.not.have.string(MESSAGE_DOUBLEQUOTE);
        expect(buildLog, 'No custom rules defined').to.not.have.string(MESSAGE_CUSTOM_RULES);
      });
    };
  }

  // specify test fixtures via a broccoli node
  const moveNode = mv(new UnwatchedDir(FIXTURES_PATH), 'foobar/fixtures');

  it('should report errors', shouldReportErrors(FIXTURES_PATH, {
    options: {
      ignore: false
    }
  }));

  describe('ignoring files', function() {
    it('should use a default ignore:true option', function shouldAcceptDefaultIgnore() {
      const promise = runEslint(FIXTURES_PATH, {
        options: {
          ignorePath: FIXTURES_PATH_ESLINTIGNORE
        }
      });

      return promise
        .then(function assertLinting({ buildLog }) {
          expect(buildLog).to.not.be.empty;
          expect(buildLog).to.not.match(MESSAGE_IGNORED_FILE_REGEXP);
        });
    });

    it('should accept an ignore option', function shouldAcceptIgnoreOption() {
      const promise = runEslint(FIXTURES_PATH, {
        options: {
          ignore: true,
          ignorePath: FIXTURES_PATH_ESLINTIGNORE
        }
      });

      return promise
        .then(function assertLinting({ buildLog }) {
          expect(buildLog).to.not.be.empty;
          expect(buildLog).to.not.match(MESSAGE_IGNORED_FILE_REGEXP);
        });
    });

    it('should work with an `.eslintignore` file', function shouldWorkWithEslintIgnoreFile() {
      const promise = runEslint(FIXTURES_PATH, {
        options: {
          ignore: true,
          cwd: path.resolve(process.cwd(), FIXTURES_PATH)
        }
      });

      return promise
        .then(function assertLinting({ buildLog }) {
          expect(buildLog).to.not.be.empty;
          expect(buildLog).to.not.match(MESSAGE_IGNORED_FILE_REGEXP);
        });
    });
  });

  it('should accept config file path', function shouldAcceptConfigFile() {
    // lint test fixtures using a config file at a non-default path
    const promise = runEslint(FIXTURES_PATH, {
      options: {
        ignore: false,
        configFile: 'conf/.eslintrc.js'
      }
    });

    return promise.then(function assertLinting({buildLog}) {
      expect(buildLog, 'Used alternate config - console allowed').to.not.have.string(RULE_TAG_NO_CONSOLE);
      expect(buildLog, 'Used alternate config - double quotes').to.have.string(MESSAGE_DOUBLEQUOTE);
    });
  });

  it('should create test files', function shouldGenerateTests() {
    const promise = runEslint(FIXTURES_PATH, {
      options: {
        ignore: false
      },
      testGenerator() {
        return 'test-content';
      }
    });

    return promise.then(function assertLinting({ outputPath }) {
      const content = fs.readFileSync(`${outputPath}/alert.lint-test.js`, 'utf-8');

      expect(content, 'Used the testGenerator').to.equal('test-content');
    });
  });

  it('should accept a node as the input', shouldReportErrors(moveNode, {
    options: {
      ignore: false
    }
  }));

  it('should not accept a many:* node as the input', function shouldNotAcceptManyStarNode() {
    expect(() => {
      runEslint(new MergeTrees([FIXTURES_PATH, 'lib']));
    }, 'Should throw descriptive error').to.throw('many:*');
  });

  it('should cache results, but still log errors', function shouldHaveCachedResults() {
    const {
      processStringSpy,
      postProcessSpy
    } = this.setupSpies();

    // run first test again, should use cache but still log errors
    return shouldReportErrors(FIXTURES_PATH, {
      options: {
        ignore: false
      }
    })()
      .then(function assertCaching() {
        // check that it actually used the cache
        expect(processStringSpy, 'Used cache')
          .to.have.callCount(0);
        expect(postProcessSpy, 'Logged errors')
          .to.have.callCount(JS_FIXTURES.length);
      });
  });

  it('should allow disabling the cache', function shouldAllowDisablingCache() {
    const {
      processStringSpy,
      postProcessSpy
    } = this.setupSpies();

    function runNonpersistent() {
      return runEslint(FIXTURES_PATH, {
        persist: false,
        options: {
          ignore: false
        }
      });
    }

    // Run twice to guarantee one run would be from cache if persisting
    const promise = runNonpersistent().then(runNonpersistent);

    return promise.then(function assertCaching() {
      // check that it did not use the cache
      expect(processStringSpy, 'Didn\'t use cache (twice)')
        .to.have.callCount(2 * JS_FIXTURES.length);
      expect(postProcessSpy, 'Logged errors (twice)')
        .to.have.callCount(2 * JS_FIXTURES.length);
    });
  });

  it('should use the configuration to cache results', function shouldCacheByConfig() {
    const { processStringSpy, postProcessSpy } = this.setupSpies();

    let processStringInitialCount;
    let postProcessInitialCount;
    let eslintrcContent;

    function runCustomRule(shouldCache) {
      return runEslint(FIXTURES_PATH, {
        options: {
          cache: shouldCache,
          rulePaths: ['conf/rules']
        }
      });
    }

    return runCustomRule(true).then(function retrieveCallCount() {
      processStringInitialCount = processStringSpy.callCount;
      postProcessInitialCount = postProcessSpy.callCount;
    })
    .then(function backupConfig() {
      eslintrcContent = fs.readFileSync(FIXTURES_PATH_ESLINTRC);
    })
    .then(function writeNewConfig() {
      fs.writeFileSync(
        FIXTURES_PATH_ESLINTRC,
        `module.exports = ${JSON.stringify({ rules: { 'custom-rule': 'error' } }, null, 2)};`,
        'utf-8'
     );
    })
    .then(() => runCustomRule(false))
    .then(function assertCaching() {
      // check that it did not use the cache
      expect(processStringSpy, 'Didn\'t use cache')
        .to.have.callCount(processStringInitialCount + JS_FIXTURES.length);
      expect(postProcessSpy, 'Logged errors')
        .to.have.callCount(postProcessInitialCount + JS_FIXTURES.length);
    })
    .finally(function restoreConfig() {
      if (typeof eslintrcContent !== 'undefined') {
        fs.writeFileSync(FIXTURES_PATH_ESLINTRC, eslintrcContent);
      }
    });
  });

  it('throws when `throwOnError` is set and result severity', function() {
    const promise = shouldReportErrors(FIXTURES_PATH, {
      options: {
        ignore: false,
      },
      throwOnError: true
    })();

    return promise.then(
      () => { throw new Error('test should have failed'); },
      (err) => {
        expect(err).to.be.an('error');
        expect(err.message).to.equal('rules violation with `error` severity level');
      }
    );
  });
});
