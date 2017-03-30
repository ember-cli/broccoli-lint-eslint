const path = require('path');
const expect = require('../chai').expect;
const runEslint = require('../helpers/run-eslint');

const MESSAGES = {
  DOUBLEQUOTE: 'Strings must use doublequote.',
  ALERT: 'Unexpected alert',
};

describe('Supporting different config file formats', function() {
  this.timeout(60000);

  const formats = [
    'js',
    'json',
    'rc',
    'yaml',
    'yml'
  ];

  formats.forEach(format => {
    it(`detects configuration files with the ${format} file type`, function() {
      const filesPath = path.join(process.cwd(), 'test/file-format-tests/formats', format);

      return runEslint(filesPath, {
        options: {
          ignore: false
        }
      }).then(result => {
        expect(result.buildLog, 'Reported erroroneous single-quoted strings')
          .to.have.string(MESSAGES.DOUBLEQUOTE)
          .to.have.string(MESSAGES.ALERT);
      });
    });
  });
});
