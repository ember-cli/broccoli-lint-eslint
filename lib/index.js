var Filter = require('broccoli-filter'),
    linter = require('eslint').linter,
    CLIEngine = require('eslint').CLIEngine;

/**
 * Calculates the severity of a eslint.linter.verify result
 * @param {Array} result Eslint verify result array
 * @return {Number} If the returned number is greater than 0 the result contains errors.
 */
function getResultSeverity (result) {
    'use strict';

    // count all errors
    return result.reduce(function (previous, message) {
        if (message.fatal) {
            return previous + 1;
        }

        if (message.severity === 2) {
            return previous + 1;
        }

        return previous;
    }, 0);
}

/**
 * Uses the content of each file in a given tree and runs eslint validation on it.
 * @param {Object} inputTree Tree from broccoli.makeTree
 * @param {{config: String, rulesdir: String, format: String}} options Filter options
 * @returns {EslintValidationFilter} Filter object
 * @constructor
 */
var EslintValidationFilter = function(inputTree, options, internalOptions) {
    'use strict';

    if (!(this instanceof EslintValidationFilter)) {
        return new EslintValidationFilter(inputTree, options, internalOptions);
    }
    this.internalOptions = internalOptions || {};
    // set inputTree
    this.inputTree = inputTree;

    options = options || {};

    // set formatter
    this.formatter = require(options.format || 'eslint/lib/formatters/stylish');

    this.cli = new CLIEngine({
        configFile: options.config || './node_modules/eslint/conf/eslint.json',
        rulePaths: options.rulesdir ? [options.rulesdir] : []
    });
};

module.exports = EslintValidationFilter;
EslintValidationFilter.prototype = Object.create(Filter.prototype);
EslintValidationFilter.prototype.constructor = EslintValidationFilter;
EslintValidationFilter.prototype.extensions = ['js'];
EslintValidationFilter.prototype.targetExtension = 'js';
EslintValidationFilter.prototype.processString = function (content, relativePath) {
    'use strict';

    var messages = [];

    // verify file content
    var result = this.cli.executeOnText(content).results[0].messages;

    // if verification has result
    if (result.length) {

        // prepare message format
        messages.push({
            filePath: relativePath,
            messages: result
        });

        // log formatter output
        console.log(this.formatter(messages));

        if (getResultSeverity(result) > 0 && 'throwOnError' in this.internalOptions && this.internalOptions.throwOnError === true) {
            // throw error if severe messages exist
            throw 'severe rule errors';
        }
    }

    // return unmodified string
    return content;
};
