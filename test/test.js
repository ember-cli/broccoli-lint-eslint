const expect = require('chai').expect;
const runEslint = require('./helpers/run-eslint');
const FIXTURES = 'test/fixture';
const CAMELCASE = '(camelcase)';
const CONSOLE = '(no-console)';
const CUSTOM_RULES = 'testing custom rules';
const DOUBLEQUOTE = 'Strings must use doublequote.';
const FILEPATH = 'fixture/1.js';

describe('EslintValidationFilter', function describeEslintValidationFilter() {
  it('should report errors', function shouldReportErrors() {
    // lint test fixtures
    const promise = runEslint(FIXTURES);

    return promise.then(function assertLinting(buildLog) {
      expect(buildLog, 'Used eslint validation').to.have.string(CAMELCASE);
      expect(buildLog, 'Shows filepath').to.have.string(FILEPATH);
      expect(buildLog, 'Used relative config - console not allowed').to.have.string(CONSOLE);
      expect(buildLog, 'Used relative config - single quotes').to.not.have.string(DOUBLEQUOTE);
      expect(buildLog, 'No custom rules defined').to.not.have.string(CUSTOM_RULES);
    });
  });

  it('should accept rule paths', function shouldAcceptRulePaths() {
    // lint test fixtures using a custom rule
    const promise = runEslint(FIXTURES, {
      options: {
        rulePaths: ['conf/rules']
      }
    });

    return promise.then(function assertLinting(buildLog) {
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

    return promise.then(function assertLinting(buildLog) {
      expect(buildLog, 'Used alternate config - console allowed').to.not.have.string(CONSOLE);
      expect(buildLog, 'Used alternate config - double quotes').to.have.string(DOUBLEQUOTE);
    });
  });
});
