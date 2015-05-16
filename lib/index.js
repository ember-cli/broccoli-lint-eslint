var Filter = require('broccoli-filter');
var CLIEngine = require('eslint').CLIEngine;

/**
 * Calculates the severity of a eslint.linter.verify result
 * @param {Array} result Eslint verify result array
 * @returns {Number} If the returned number is greater than 0 the result contains errors.
 */
function getResultSeverity(result) {

  // count all errors
  return result.reduce(function reduceToCount(previous, message) {
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
 * Ignores messages that are about ignored files as they are intended
 * but we are processing a file at a time
 *
 * @param {Array} errors result errors
 * @returns {Array} filtered errors
 */
function filterIgnoredFileMessages(errors) {
  var ignoreRegex = /File ignored because of your \.eslintignore file/;

  return errors.filter(function filterErrors(error) {
    if (error.message.match(ignoreRegex)) {
      return false;
    }
    return true;
  });
}

/**
 * Filters all ignored file messages from result object
 * @param {Object} result result errors
 * @returns {Object} filtered results
 */
function filterAllIgnoredFileMessages(result) {
  var resultOutput = result;

  result.results.map(function filterIgnoredErrors(resultItem) {
    resultItem.messages = filterIgnoredFileMessages(resultItem.messages);
    return resultItem;
  });
  return resultOutput;
}

/**
 * Uses the content of each file in a given tree and runs eslint validation on it.
 * @param {Object} inputTree Tree from broccoli.makeTree
 * @param {{config: String, rulesdir: String, format: String}} options Filter options
 * @returns {EslintValidationFilter} Filter obconfig @constructor
 */
function EslintValidationFilter(inputTree, options) {
  if (!(this instanceof EslintValidationFilter)) {
    return new EslintValidationFilter(inputTree, options);
  }
  this.options = options || {};
  this.eslintOptions = options.options || {};
  // set inputTree
  this.inputTree = inputTree;

  // set formatter
  this.formatter = require(this.options.format || 'eslint/lib/formatters/stylish');

  this.cli = new CLIEngine(this.eslintOptions);


  this.testGenerator = options.testGenerator;
  if (this.testGenerator) {
    this.targetExtension = 'eslint-test.js';
  }
}

module.exports = EslintValidationFilter;
EslintValidationFilter.prototype = Object.create(Filter.prototype);
EslintValidationFilter.prototype.constructor = EslintValidationFilter;
EslintValidationFilter.prototype.extensions = ['js'];
EslintValidationFilter.prototype.targetExtension = 'js';

EslintValidationFilter.prototype.write = function write(readTree, destDir) {
  var that = this;

  return readTree(this.inputTree).then(function writeTree(srcDir) {
    if (!that.eslintrc) {
      that.eslintrc = srcDir;
    }

    return Filter.prototype.write.call(that, readTree, destDir);
  });
};

EslintValidationFilter.prototype.processString = function processString(content, relativePath) {
  // verify file content
  var result = this.cli.executeOnFiles([this.eslintrc + '/' + relativePath]);
  var filteredResults = filterAllIgnoredFileMessages(result);

  // if verification has result
  if (filteredResults.results.length) {

    // log formatter output
    console.log(this.formatter(filteredResults.results));

    if (getResultSeverity(filteredResults.results) > 0) {
      if ('throwOnError' in this.internalOptions && this.internalOptions.throwOnError === true) {
        // throw error if severe messages exist
        throw new Error('severe rule errors');
      }
    }
  }

  if (this.testGenerator) {
    return this.testGenerator(relativePath, filteredResults.results[0].messages || []);
  }

  // return unmodified string
  return content;
};
