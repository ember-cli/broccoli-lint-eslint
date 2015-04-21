var Filter = require('broccoli-filter');
var CLIEngine = require('eslint').CLIEngine;
var linter = require('eslint').linter;
var path = require('path');

/**
 * Calculates the severity of a eslint.linter.verify result
 * @param {Array} result Eslint verify result array
 * @returns {Number} If the returned number is greater than 0 the result contains errors.
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
  var config = {};

  if (!(this instanceof EslintValidationFilter)) {
    return new EslintValidationFilter(inputTree, options, internalOptions);
  }
  this.internalOptions = internalOptions || {};
  // set inputTree
  this.inputTree = inputTree;

  options = options || {};

  // set formatter
  this.formatter = require(options.format || 'eslint/lib/formatters/stylish');

  this.cleanup = function () {};

  config.rulePaths = options.rulesdir ? [options.rulesdir] : [];

  if ('config' in options) {
    config.rulePaths = options.config;
  }

  this.cli = new CLIEngine(options);


  this.testGenerator = options.testGenerator;
  if (this.testGenerator) {
    this.targetExtension = 'eslint-test.js';
  }
};

module.exports = EslintValidationFilter;
EslintValidationFilter.prototype = Object.create(Filter.prototype);
EslintValidationFilter.prototype.constructor = EslintValidationFilter;
EslintValidationFilter.prototype.extensions = ['js'];
EslintValidationFilter.prototype.targetExtension = 'js';

EslintValidationFilter.prototype.write = function (readTree, destDir) {
  var that = this

  return readTree(this.inputTree).then(function (srcDir) {
    if (!that.eslintrc) {
      that.eslintrc = srcDir;
    }

    return Filter.prototype.write.call(that, readTree, destDir)
  });
};

EslintValidationFilter.prototype.processString = function (content, relativePath) {
  'use strict';

  var messages = [];

  // verify file content
  var config = this.cli.getConfigForFile(this.eslintrc + '/' + relativePath);
  var result = linter.verify(content, config, relativePath);

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

  if (this.testGenerator) {
    return this.testGenerator(relativePath, result);
  }

  // return unmodified string
  return content;
};
