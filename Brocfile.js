var eslint = require('./lib/index'),
    mergeTrees = require('broccoli-merge-trees');

// lint plugin code
var plugin = eslint('lib', {
    config: './eslint.json'
});

// lint tests
var test = eslint('test', {
    config: './conf/eslint.json',
    rulesdir: './conf/rules',
    format: 'eslint/lib/formatters/compact'
});

module.exports = mergeTrees([plugin, test], { overwrite: true });
