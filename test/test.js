const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const runEslint = require('./helpers/run-eslint');
const FIXTURES = 'test/fixture';
const CAMELCASE = '(camelcase)';
const CONSOLE = '(no-console)';
const CUSTOM_RULES = 'testing custom rules';
const DOUBLEQUOTE = 'Strings must use doublequote.';
const FILEPATH = 'fixture/1.js';
const TEST_IGNORE_PATH = path.resolve(process.cwd(), './test/fixture/.eslintignore');

describe('EslintValidationFilter', function describeEslintValidationFilter() {
  it('should report errors', function shouldReportErrors() {
    // lint test fixtures
    const promise = runEslint(FIXTURES, {
      options: {
        ignore: false
      }
    });

    return promise.then(function assertLinting({buildLog}) {
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
        .to.not.match(/File ignored because of a matching ignore pattern\. Use --no-ignore to override\./);
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
        .to.not.match(/File ignored because of a matching ignore pattern\. Use --no-ignore to override\./);
      });
  });

  it('should accept config file path', function shouldAcceptConfigFile() {
    // lint test fixtures using a config file at a non-default path
    const promise = runEslint(FIXTURES, {
      options: {
        ignore: false,
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
});
