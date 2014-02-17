module.exports = function (broccoli) {
    var pickFiles = require('broccoli-static-compiler'),
        eslintFilter = require('./index');

    var app = broccoli.makeTree('testApp')
    app = pickFiles(app, {
        destDir: '/testApp',
        srcDir: '/'
    });
    app = eslintFilter(app, {
        config: './eslint.json'
    });

    return [app];
};