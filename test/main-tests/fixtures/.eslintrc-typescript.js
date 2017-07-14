'use strict';

module.exports = {
  parser: 'typescript-eslint-parser',
  env: {
    mocha: true
  },
  globals: {
    chai: false,
    expect: false
  },
  rules: {
    'no-unused-vars': 'error'
  }
};
