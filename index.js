var Filter = require('broccoli-filter'),
    eslint = require('eslint'),
    formatter = require('eslint/lib/formatters/stylish'),
    Config = require('eslint/lib/config');

module.exports = EslintValidationFilter;
EslintValidationFilter.prototype = Object.create(Filter.prototype);
EslintValidationFilter.prototype.constructor = EslintValidationFilter;
function EslintValidationFilter (inputTree, options) {
    if (!(this instanceof EslintValidationFilter)) return new EslintValidationFilter(inputTree, options);
    this.inputTree = inputTree;
    this.options = options || {}
}

EslintValidationFilter.prototype.extensions = ['js'];
EslintValidationFilter.prototype.targetExtension = 'js';

EslintValidationFilter.prototype.processString = function (string) {
    var configHelper = new Config({
            config: this.options.config
        }),
        config = configHelper.getConfig(),
        result = eslint.linter.verify(string, config),
        messages = [],
        errCount = 0,
        output;

    // if verification has result
    if (result.length) {

        // prepare message format
        messages.push({
            filePath: 'broccoli isn\'t using files. tmp: ' + this.inputTree._tmpCacheDir,
            messages: result
        });
        // log formatter output
        console.log(formatter(messages, config));

        // count all errors
        errCount = result.reduce(function(previous, message) {
            var severity = null;

            if (message.fatal) {
                return previous + 1;
            }

            severity = config.rules[message.ruleId][0] ||
                config.rules[message.ruleId];

            if (severity === 2) {
                return previous + 1;
            }

            return previous;
        }, 0);

        // throw error if severe messages exist
        if (errCount > 0) {
            throw 'severe rule errors';
        }
    }

    // return unmodified string
    return string;
};