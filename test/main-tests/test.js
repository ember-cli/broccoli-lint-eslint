/* eslint-disable no-unused-expressions */
const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const stew = require('broccoli-stew');
const mv = stew.mv;
const UnwatchedDir = require('broccoli-source').UnwatchedDir;
const MergeTrees = require('broccoli-merge-trees');
const eslint = require('../../index');
const runEslint = require('../helpers/run-eslint');
const FIXTURES = 'test/main-tests/fixture';
const RULE_TAG_CAMELCASE = '(camelcase)';
const RULE_TAG_NO_CONSOLE = '(no-console)';
const CUSTOM_RULES = 'testing custom rules';
const DOUBLEQUOTE = 'Strings must use doublequote.';
const FILEPATH = 'fixture/1.js';
const TEST_IGNORE_PATH = path.resolve(process.cwd(), './test/main-tests/fixture/.eslintignore');
const IGNORED_FILE_MESSAGE_REGEXP = /(?:File ignored by default\.)|(?:File ignored because of a matching ignore pattern\.)/;
const JS_FIXTURES = fs.readdirSync(FIXTURES).filter((name) => /\.js$/.test(name));

describe('EslintValidationFilter', function describeEslintValidationFilter() {

  before(function beforeEslintValidationFilter() {
    this.setupSpies = function setupSpies() {
      // spy on filter process methods
      const processStringSpy = this.sinon.spy(eslint.prototype, 'processString');
      const postProcessSpy = this.sinon.spy(eslint.prototype, 'postProcess');

      return { processStringSpy, postProcessSpy };
    };
  });

  function shouldReportErrors(inputTree, options) {
    return function _shouldReportErrors() {
      // lint test fixtures
      const promise = runEslint(inputTree, options);

      return promise.then(function assertLinting({buildLog}) {
        expect(buildLog, 'Used eslint validation').to.have.string(RULE_TAG_CAMELCASE);
        expect(buildLog, 'Shows filepath').to.have.string(FILEPATH);
        expect(buildLog, 'Used relative config - console not allowed').to.have.string(RULE_TAG_NO_CONSOLE);
        expect(buildLog, 'Used relative config - single quotes').to.not.have.string(DOUBLEQUOTE);
        expect(buildLog, 'No custom rules defined').to.not.have.string(CUSTOM_RULES);
      });
    };
  }

  // specify test fixtures via a broccoli node
  const moveTree = mv(new UnwatchedDir(FIXTURES), 'foobar/fixture');

  it('should report errors', shouldReportErrors(FIXTURES, {
    options: {
      ignore: false
    }
  }));

  it('should accept rule paths', function shouldAcceptRulePaths() {
    // lint test fixtures using a custom rule
    const promise = runEslint(FIXTURES, {
      options: {
        ignore: false,
        rulePaths: ['conf/rules'],
        rules: {
          'custom-no-alert': 2
        }
      }
    });

    return promise.then(function assertLinting({buildLog}) {
      expect(buildLog, 'Used custom rule').to.have.string(CUSTOM_RULES);
    });
  });

  it('should use a default ignore:true option', function shouldAcceptDefaultIgnore() {
    const promise = runEslint(FIXTURES, {
      options: {
        ignorePath: TEST_IGNORE_PATH
      }
    });

    return promise
      .then(function assertLinting({buildLog}) {
        expect(buildLog)
        .to.not.match(IGNORED_FILE_MESSAGE_REGEXP);
      });
  });

  it('should accept an ignore option', function shouldAcceptIgnoreOption() {
    const promise = runEslint(FIXTURES, {
      options: {
        ignore: true,
        ignorePath: TEST_IGNORE_PATH
      }
    });

    return promise
      .then(function assertLinting({buildLog}) {
        expect(buildLog)
        .to.not.match(IGNORED_FILE_MESSAGE_REGEXP);
      });
  });

  it('should accept config file path', function shouldAcceptConfigFile() {
    // lint test fixtures using a config file at a non-default path
    const promise = runEslint(FIXTURES, {
      options: {
        ignore: false,
        configFile: 'conf/.eslintrc.js'
      }
    });

    return promise.then(function assertLinting({buildLog}) {
      expect(buildLog, 'Used alternate config - console allowed').to.not.have.string(RULE_TAG_NO_CONSOLE);
      expect(buildLog, 'Used alternate config - double quotes').to.have.string(DOUBLEQUOTE);
    });
  });

  it('should create test files', function shouldGenerateTests() {
    const promise = runEslint(FIXTURES, {
      options: {
        ignore: false
      },
      testGenerator() {
        return 'test-content';
      }
    });

    return promise.then(function assertLinting({outputPath}) {
      const content = fs.readFileSync(`${outputPath}/1.lint-test.js`, 'utf8');

      expect(content, 'Used the testGenerator').to.equal('test-content');
    });
  });

  it('should accept a node as the input', shouldReportErrors(moveTree, {
    options: {
      ignore: false
    }
  }));

  it('should not accept a many:* node as the input', function shouldNotAcceptManyStarNode() {
    expect(() => {
      runEslint(new MergeTrees([FIXTURES, 'lib']));
    }, 'Should throw descriptive error').to.throw('many:*');
  });

  it('should cache results, but still log errors', function shouldHaveCachedResults() {
    const {
      processStringSpy,
      postProcessSpy
    } = this.setupSpies();

    // run first test again, should use cache but still log errors
    return shouldReportErrors(FIXTURES, {
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
      return runEslint(FIXTURES, {
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
    const {
      processStringSpy,
      postProcessSpy
    } = this.setupSpies();
    let processStringInitialCount;
    let postProcessInitialCount;
    const eslintrcPath = path.join(FIXTURES, '.eslintrc.js');
    let eslintrcContent;

    function runCustomRule() {
      return runEslint(FIXTURES, {
        options: {
          rulePaths: ['conf/rules']
        }
      });
    }

    return runCustomRule().then(function retrieveCallCount() {
      processStringInitialCount = processStringSpy.callCount;
      postProcessInitialCount = postProcessSpy.callCount;
    })
    .then(function backupConfig() {
      eslintrcContent = fs.readFileSync(eslintrcPath);
    })
    .then(function writeNewConfig() {
      fs.writeFileSync(
        eslintrcPath,
        'module.exports = ' + JSON.stringify({
          extends: 'eslint:recommended',
          rules: {
            'custom-no-alert': 2
          }
        }) + ';'
      );
    })
    .then(runCustomRule)
    .then(function assertCaching() {
      // check that it did not use the cache
      expect(processStringSpy, 'Didn\'t use cache')
        .to.have.callCount(processStringInitialCount + JS_FIXTURES.length);
      expect(postProcessSpy, 'Logged errors')
        .to.have.callCount(postProcessInitialCount + JS_FIXTURES.length);
    })
    .finally(function restoreConfig() {
      if (typeof eslintrcContent !== 'undefined') {
        fs.writeFileSync(eslintrcPath, eslintrcContent);
      }
    });
  });
});
