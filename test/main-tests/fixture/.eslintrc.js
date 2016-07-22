'use strict';

module.exports = {
  extends: 'eslint:recommended',
  rules: {
    camelcase: ['error', { properties: 'always' }],
    'no-alert': 'error'
  }
};
