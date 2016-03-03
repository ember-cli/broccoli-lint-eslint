const eslint = require('./lib/index');
const mergeTrees = require('broccoli-merge-trees');

// lint plugin code
const plugin = eslint('lib', {
  options: {
    ignore: false
  }
});

// lint tests
const test = eslint('test', {
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
