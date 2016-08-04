/* eslint-disable no-unused-expressions */
const path = require('path');
const expect = require('chai').expect;
const runEslint = require('../helpers/run-eslint');
const FILES_PATH = './formats';

const MESSAGES = {
  DOUBLEQUOTE: 'Strings must use doublequote.',
  ALERT: 'Unexpected alert',
};

describe('Supporting different config file formats', function describeMultipleFormatSupport() {
  const formats = [
    'js',
    'json',
    'rc',
    'yaml',
    'yml'
  ];

  return Promise.all(formats.map((format) => {

    return new Promise((resolve) => {

      it(`detects configuration files with the ${format} file type`, function configFileTypeSupport() {
        const filesPath = path.join(process.cwd(), 'test/file-format-tests/formats', format);

        const promise = runEslint(filesPath, {
          options: {
            ignore: false
          }
        });

        return promise.then(function assertLinting({buildLog}) {
          expect(buildLog, 'Reported erroroneous single-quoted strings').to.have.string(MESSAGES.DOUBLEQUOTE);
          expect(buildLog, 'Reported erroroneous use of alert').to.have.string(MESSAGES.ALERT);
        });
      });
    });
  }));
});
