'use strict';

var eslint = require('./lib/index');
var mergeTrees = require('broccoli-merge-trees');

// lint plugin code
var plugin = eslint('lib', {
  options: {
    ignore: false
  }
});

// lint tests
var test = eslint('test', {
  options: {
    ignore: false,
    rulePaths: ['conf/rules'],
    configFile: 'conf/eslint.json'
  },
  format: 'eslint/lib/formatters/compact'
});

module.exports = mergeTrees([plugin, test], {
  overwrite: true
});
