module.exports = function (broccoli) {
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

    return mergeTrees([plugin, test], { overwrite: true });
};