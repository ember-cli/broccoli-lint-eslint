const fs = require('fs');
const path = require('path');
const expect = require('../chai').expect;
const sinon = require('sinon');
const mv = require('broccoli-stew').mv;
const UnwatchedDir = require('broccoli-source').UnwatchedDir;
const MergeTrees = require('broccoli-merge-trees');

const eslint = require('../../');
const runEslint = require('../helpers/run-eslint');

const RULE_TAG_NO_CONSOLE = '(no-console)';
const MESSAGE_DOUBLEQUOTE = 'Strings must use doublequote.';
const MESSAGE_CUSTOM_RULES = 'testing custom rules';
const MESSAGE_IGNORED_FILE_REGEXP = /(?:File ignored by default\.)|(?:File ignored because of a matching ignore pattern\.)/;

const FIXTURES_PATH = 'test/main-tests/fixtures';
const FIXTURES_PATH_ESLINTIGNORE = path.resolve(process.cwd(), './test/main-tests/fixtures/.eslintignore');
const FIXTURES_PATH_ESLINTIGNORE_FOR_WARNING = path.resolve(process.cwd(), './test/main-tests/fixtures/.eslintignore-all-but-warning');
const FIXTURES_PATH_ESLINTRC_ALTERNATE = path.join(FIXTURES_PATH, '.eslintrc-alternate.js');
const FIXTURE_FILE_PATH_ALERT = 'fixtures/alert.js';
const JS_FIXTURES = fs.readdirSync(FIXTURES_PATH).filter((name) => /\.js$/.test(name) && !/^.eslintrc/.test(name));


describe('EslintValidationFilter', function() {
  this.timeout(60000);

  before(function() {
    this.setupSpies = function() {
      // spy on filter process methods
      const processStringSpy = this.sinon.spy(eslint.prototype, 'processString');
      const postProcessSpy = this.sinon.spy(eslint.prototype, 'postProcess');

      return { processStringSpy, postProcessSpy };
    };
  });

  beforeEach(function() {
    this.sinon = sinon.createSandbox();
  });

  afterEach(function() {
    this.sinon.restore();
  });

  function shouldReportErrors(inputNode, options) {
    return function _shouldReportErrors() {
      // lint test fixtures
      const promise = runEslint(inputNode, options);

      return promise.then(function(result) {
        expect(result.buildLog, 'Used eslint validation').to.have.string(RULE_TAG_NO_CONSOLE);
        expect(result.buildLog, 'Shows filepath').to.have.string(FIXTURE_FILE_PATH_ALERT);
        expect(result.buildLog, 'Used relative config - console not allowed').to.have.string(RULE_TAG_NO_CONSOLE);
        expect(result.buildLog, 'Used relative config - single quotes').to.not.have.string(MESSAGE_DOUBLEQUOTE);
        expect(result.buildLog, 'No custom rules defined').to.not.have.string(MESSAGE_CUSTOM_RULES);
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
    it('should use a default ignore:true option', function() {
      return runEslint(FIXTURES_PATH, {
        options: {
          ignorePath: FIXTURES_PATH_ESLINTIGNORE
        }
      }).then(result => {
        expect(result.buildLog).to.not.be.empty;
        expect(result.buildLog).to.not.match(MESSAGE_IGNORED_FILE_REGEXP);
      });
    });

    it('should accept an ignore option', function() {
      return runEslint(FIXTURES_PATH, {
        options: {
          ignore: true,
          ignorePath: FIXTURES_PATH_ESLINTIGNORE
        }
      }).then(result => {
        expect(result.buildLog).to.not.be.empty;
        expect(result.buildLog).to.not.match(MESSAGE_IGNORED_FILE_REGEXP);
      });
    });

    it('should work with an `.eslintignore` file', function() {
      return runEslint(FIXTURES_PATH, {
        options: {
          ignore: true,
          cwd: path.resolve(process.cwd(), FIXTURES_PATH)
        }
      }).then(result => {
        expect(result.buildLog).to.not.be.empty;
        expect(result.buildLog).to.not.match(MESSAGE_IGNORED_FILE_REGEXP);
      });
    });
  });

  it('should accept config file path', function() {
    // lint test fixtures using a config file at a non-default path
    return runEslint(FIXTURES_PATH, {
      options: {
        ignore: false,
        configFile: FIXTURES_PATH_ESLINTRC_ALTERNATE
      }
    }).then(result => {
      expect(result.buildLog, 'Used alternate config - console allowed').to.not.have.string(RULE_TAG_NO_CONSOLE);
      expect(result.buildLog, 'Used alternate config - double quotes').to.have.string(MESSAGE_DOUBLEQUOTE);
    });
  });

  it('should create test files', function() {
    return runEslint(FIXTURES_PATH, {
      options: {
        ignore: false
      },
      testGenerator() {
        return 'test-content';
      }
    }).then(result => {
      const content = fs.readFileSync(`${result.outputPath}/alert.lint-test.js`, 'utf-8');

      expect(content, 'Used the testGenerator').to.equal('test-content');
    });
  });

  it('should accept a node as the input', shouldReportErrors(moveNode, {
    options: {
      ignore: false
    }
  }));

  it('should not accept a many:* node as the input', function() {
    expect(() => {
      runEslint(new MergeTrees([FIXTURES_PATH, 'lib']));
    }, 'Should throw descriptive error').to.throw('many:*');
  });

  it('should cache results, but still log errors', function() {
    const spies = this.setupSpies();

    // run first test again, should use cache but still log errors
    return shouldReportErrors(FIXTURES_PATH, {
      options: {
        ignore: false
      }
    })().then(function() {
      // check that it actually used the cache
      expect(spies.processStringSpy, 'Used cache').to.have.callCount(0);
      expect(spies.postProcessSpy, 'Logged errors').to.have.callCount(JS_FIXTURES.length);
    });
  });

  it('should not call processString for ignored files', function() {
    const spies = this.setupSpies();

    function runNonpersistent() {
      return runEslint(FIXTURES_PATH, {
        persist: false,
        options: {
          ignorePath: FIXTURES_PATH_ESLINTIGNORE
        }
      });
    }

    return runNonpersistent().then(() => {
      expect(spies.processStringSpy, 'Doesn\'t call processString for ignored files')
        .to.have.callCount(JS_FIXTURES.length - 1);
    });
  });

  describe('disabling cache', function() {
    let force;

    beforeEach(function() {
      force = process.env.FORCE_PERSISTENCE_IN_CI;
      delete process.env.FORCE_PERSISTENCE_IN_CI;
    });

    afterEach(function() {
      process.env.FORCE_PERSISTENCE_IN_CI = force;
    });

    it('should allow disabling the cache', function() {
      const spies = this.setupSpies();

      function runNonpersistent() {
        return runEslint(FIXTURES_PATH, {
          persist: false,
          options: {
            ignore: false
          }
        });
      }

      // Run twice to guarantee one run would be from cache if persisting
      return runNonpersistent().then(runNonpersistent).then(() => {
        // check that it did not use the cache
        expect(spies.processStringSpy, 'Didn\'t use cache (twice)')
          .to.have.callCount(2 * JS_FIXTURES.length);
        expect(spies.postProcessSpy, 'Logged errors (twice)')
          .to.have.callCount(2 * JS_FIXTURES.length);
      });
    });
  });

  it('throws when `throwOnError` is set and result severity is >= 2', function() {
    return expect(shouldReportErrors(FIXTURES_PATH, {
      options: {
        ignore: false,
      },
      throwOnError: true
    })()).to.be.rejected.then(err => {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('rules violation with `error` severity level');
    });
  });

  it('throws when `throwOnWarn` is set and result severity is >= 2', function() {
    return expect(shouldReportErrors(FIXTURES_PATH, {
      options: {
        ignore: false,
      },
      throwOnWarn: true
    })()).to.be.rejected.then(err => {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('rules violation with `error` severity level');
    });
  });

  it('throws when `throwOnWarn` is set and result severity is 1', function() {
    return expect(shouldReportErrors(FIXTURES_PATH, {
      options: {
        ignore: true,
        cache: false,  // ensure that other tests
        ignorePath: FIXTURES_PATH_ESLINTIGNORE_FOR_WARNING
      },
      throwOnWarn: true
    })()).to.be.rejected.then(err => {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('rules violation with `warn` severity level');
    });
  });
});
