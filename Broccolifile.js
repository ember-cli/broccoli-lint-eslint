module.exports = function (broccoli) {
    var pickFiles = require('broccoli-static-compiler'),
        eslintFilter = require('./index');

    var app = broccoli.makeTree('test')
    app = pickFiles(app, {
        destDir: '/test',
        srcDir: '/'
    });
    app = eslintFilter(app, {
        config: './conf/eslint.json',
        rulesdir: './conf/rules'
    });

    return [app];
};