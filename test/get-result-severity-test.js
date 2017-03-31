'use strict';

const expect = require('./chai').expect;
const getResultSeverity = require('../lib/get-result-severity');

describe('getResultSeverity()', function() {
  it('results in at least 2 if there are errors', function() {
    let messages = [
      { severity: 0 },
      { severity: 2 },
      { severity: 1 },
      { severity: 0 },
      { severity: 0 },
      { severity: 2 },
    ];

    expect(getResultSeverity(messages)).to.be.at.least(2);
  });

  it('results in 1 if there are only warnings', function() {
    let messages = [
      { severity: 0 },
      { severity: 1 },
      { severity: 1 },
      { severity: 0 },
      { severity: 0 },
      { severity: 1 },
    ];

    expect(getResultSeverity(messages)).to.equal(1);
  });

  it('results in 0 if there are no errors or warnings', function() {
    let messages = [
      { severity: 0 },
      { severity: 0 },
      { severity: 0 },
      { severity: 0 },
      { severity: 0 },
      { severity: 0 },
    ];

    expect(getResultSeverity(messages)).to.equal(0);
  });

  it('results in 0 if there are no messages are passed', function() {
    expect(getResultSeverity()).to.equal(0);
  });
});
