var Filter = require('broccoli-filter'),
    eslint = require('eslint'),
    rules = require('eslint/lib/rules'),
    Config = require('eslint/lib/config');

var formatter;

module.exports = EslintValidationFilter;
EslintValidationFilter.prototype = Object.create(Filter.prototype);
EslintValidationFilter.prototype.constructor = EslintValidationFilter;
function EslintValidationFilter (inputTree, options) {
    if (!(this instanceof EslintValidationFilter)) return new EslintValidationFilter(inputTree, options);
    this.inputTree = inputTree;

    // set options defaults
    this.options = {
        format: options.format ? options.format : undefined,
        rulesdir: options.rulesdir ? options.rulesdir : undefined,
        config: options.config ? options.config : './eslint.json'
    };

    formatter = require(this.options.format ? this.options.format : 'eslint/lib/formatters/stylish');
}

EslintValidationFilter.prototype.extensions = ['js'];
EslintValidationFilter.prototype.targetExtension = 'js';

EslintValidationFilter.prototype.processString = function (string) {
    var configHelper = new Config({
            config: this.options.config
        }),
        config,
        result,
        messages = [],
        errCount = 0;

    // set rulesdir if given
    if (this.options.rulesdir) {
        rules.load(this.options.rulesdir);
    }

    config = configHelper.getConfig();
    result = eslint.linter.verify(string, config);

    // if verification has result
    if (result.length) {

        // prepare message format
        messages.push({
            filePath: '[TODO: #1]',
            messages: result
        });

        // log formatter output
        console.log(formatter(messages, config));

        // count all errors
        errCount = result.reduce(function(previous, message) {
            var severity;

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