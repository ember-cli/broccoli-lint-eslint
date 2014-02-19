module.exports = function (broccoli) {
    var eslint = require('./index');

    var app = broccoli.makeTree('test');
    app = eslint(app, {
        config: './conf/eslint.json',
        rulesdir: './conf/rules',
        format: 'eslint/lib/formatters/compact'
    });

    return [app];
};