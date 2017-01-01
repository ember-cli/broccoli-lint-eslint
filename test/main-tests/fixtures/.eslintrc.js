'use strict';

module.exports = {
  env: {
    mocha: true
  },
  globals: {
    chai: false,
    expect: false
  },
  rules: {
    'no-alert': 'error',
    'no-unused-vars': 'error',
    'no-console': 'error',
    'newline-before-return': 'warn',
    'camelcase': 'error'
  }
};
