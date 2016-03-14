/* eslint-disable no-unused-expressions */
const fs = require('fs');
const expect = require('chai').expect;
const stew = require('broccoli-stew');
const mv = stew.mv;
const UnwatchedDir = require('broccoli-source').UnwatchedDir;
const MergeTrees = require('broccoli-merge-trees');
const runEslint = require('./helpers/run-eslint');
const FIXTURES = 'test/fixture';
const CAMELCASE = '(camelcase)';
const CONSOLE = '(no-console)';
const CUSTOM_RULES = 'testing custom rules';
const DOUBLEQUOTE = 'Strings must use doublequote.';
const FILEPATH = 'fixture/1.js';

describe('EslintValidationFilter', function describeEslintValidationFilter() {
  function shouldReportErrors(inputTree) {
    return function _shouldReportErrors() {
      // lint test fixtures
      const promise = runEslint(inputTree);

      return promise.then(function assertLinting({buildLog}) {
        expect(buildLog, 'Used eslint validation').to.have.string(CAMELCASE);
        expect(buildLog, 'Shows filepath').to.have.string(FILEPATH);
        expect(buildLog, 'Used relative config - console not allowed').to.have.string(CONSOLE);
        expect(buildLog, 'Used relative config - single quotes').to.not.have.string(DOUBLEQUOTE);
        expect(buildLog, 'No custom rules defined').to.not.have.string(CUSTOM_RULES);
      });
    };
  }

  it('should report errors', shouldReportErrors(FIXTURES));

  it('should accept rule paths', function shouldAcceptRulePaths() {
    // lint test fixtures using a custom rule
    const promise = runEslint(FIXTURES, {
      options: {
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

  it('should accept config file path', function shouldAcceptConfigFile() {
    // lint test fixtures using a config file at a non-default path
    const promise = runEslint(FIXTURES, {
      options: {
        configFile: 'conf/eslint.json'
      }
    });

    return promise.then(function assertLinting({buildLog}) {
      expect(buildLog, 'Used alternate config - console allowed').to.not.have.string(CONSOLE);
      expect(buildLog, 'Used alternate config - double quotes').to.have.string(DOUBLEQUOTE);
    });
  });

  it('should create test files', function shouldGenerateTests() {
    const promise = runEslint(FIXTURES, {
      testGenerator() {
        return 'test-content';
      }
    });

    return promise.then(function assertLinting({outputPath}) {
      const content = fs.readFileSync(`${outputPath}/1.lint-test.js`, 'utf8');

      expect(content, 'Used the testGenerator').to.equal('test-content');
    });
  });

  // specify test fixtures via a broccoli node
  it('should accept a node as the input', shouldReportErrors(mv(new UnwatchedDir(FIXTURES), 'foobar/fixture')));

  it('should not accept a many:* node as the input', function shouldNotAcceptManyStarNode() {
    expect(() => {
      runEslint(new MergeTrees([FIXTURES, 'lib']));
    }, 'Should throw descriptive error').to.throw('many:*');
  });
});
