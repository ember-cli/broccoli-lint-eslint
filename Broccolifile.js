module.exports = function (broccoli) {
    var eslint = require('./lib/index');

    // lint plugin code
    var plugin = broccoli.makeTree('lib');
    plugin = eslint(plugin, {
        config: './eslint.json'
    });

    // lint tests
    var test = broccoli.makeTree('test');
    test = eslint(test, {
        config: './conf/eslint.json',
        rulesdir: './conf/rules',
        format: 'eslint/lib/formatters/compact'
    });

    return [plugin, test];
};