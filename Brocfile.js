var eslint = require('./lib/index'),
    mergeTrees = require('broccoli-merge-trees');

// lint plugin code
var plugin = eslint('lib', {
});

// lint tests
var test = eslint('test', {
    rulePaths: ['conf/rules'],
    format: 'eslint/lib/formatters/compact'
});

module.exports = mergeTrees([plugin, test], { overwrite: true });
