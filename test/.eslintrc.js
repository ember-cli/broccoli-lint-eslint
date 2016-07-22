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
    'no-invalid-this': 'off',
    'arrow-body-style': ['off', "as-needed"]
  }
};
