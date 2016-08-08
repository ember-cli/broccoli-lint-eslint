/* eslint global-require: 0, consistent-return: 0 */

const Filter = require('broccoli-persistent-filter');
const CLIEngine = require('eslint').CLIEngine;
const md5Hex = require('md5-hex');
const stringify = require('json-stable-stringify');
const path = require('path');
const escapeStringRegexp = require('escape-string-regexp');
const BUILD_DIR_REGEXP = new RegExp('(' + escapeStringRegexp(path.sep) + ')?build(' + escapeStringRegexp(path.sep) + ')?$');
const IGNORED_FILE_MESSAGE_REGEXP = /(?:File ignored by default\.)|(?:File ignored because of a matching ignore pattern\.)/;


/**
 * Calculates the severity of a eslint.linter.verify result
 * @param {Array} result Eslint verify result array
 * @returns {Number} If the returned number is greater than 0 the result contains errors.
 */
function getResultSeverity(resultMessages = []) {
  // count all errors
  return resultMessages.reduce((totalSeverity, message) => {
    if (message.fatal) {
      return totalSeverity + 1;
    }

    if (message.severity === 2) {
      return totalSeverity + 1;
    }

    return totalSeverity;
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
  return errors.filter((error) => !IGNORED_FILE_MESSAGE_REGEXP.test(error.message));
}

/**
 * Filters all ignored file messages from result object
 * @param {Object} result result errors
 * @returns {Object} filtered results
 */
function filterAllIgnoredFileMessages(result) {
  const resultOutput = result;

  resultOutput.results.forEach((resultItem) => {
    resultItem.messages = filterIgnoredFileMessages(resultItem.messages);
  });

  return resultOutput;
}

function resolveInputDirectory(inputNode) {
  if (typeof inputNode === 'string') {
    return inputNode;
  }

  // eslint-disable-next-line no-underscore-dangle
  const nodeInfo = inputNode.__broccoliGetInfo__();

  if (nodeInfo.nodeType === 'source') {
    return nodeInfo.sourceDirectory;
  }

  if (nodeInfo.inputNodes.length > 1) {
    // eslint-disable-next-line max-len
    throw new Error('EslintValidationFilter can only handle one:* broccoli nodes, but part of the given input pipeline is a many:* node. (broccoli-merge-trees is an example of a many:* node) Please perform many:* operations after linting.');
  }

  return resolveInputDirectory(nodeInfo.inputNodes[0]);
}

/**
 * Uses the content of each file in a given node and runs eslint validation on it.
 * @param {Object} inputNode Node from broccoli.makeTree
 * @param {{config: String, rulesdir: String, format: String}} options Filter options
 * @returns {EslintValidationFilter} Filter obconfig @constructor
 */
function EslintValidationFilter(inputNode, options = {}) {
  if (!(this instanceof EslintValidationFilter)) {
    return new EslintValidationFilter(inputNode, options);
  }

  this.internalOptions = options;
  const eslintOptions = options.options || {};

  // default ignore:true option
  if (typeof eslintOptions.ignore === 'undefined') {
    eslintOptions.ignore = true;
  }

  // default is to persist filter output
  if (typeof this.internalOptions.persist === 'undefined') {
    this.internalOptions.persist = true;
  }

  // call base class constructor
  Filter.call(this, inputNode, this.internalOptions);

  // set formatter
  if (typeof this.internalOptions.format === 'function') {
    this.formatter = this.internalOptions.format;
  } else {
    // eslint-disable-next-line global-require
    this.formatter = require(this.internalOptions.format || 'eslint/lib/formatters/stylish');
  }

  this.console = options.console || console;

  this.cli = new CLIEngine(eslintOptions);

  this.eslintrc = resolveInputDirectory(inputNode);

  this.testGenerator = this.internalOptions.testGenerator;
  if (this.testGenerator) {
    this.targetExtension = 'lint-test.js';
  }
}

module.exports = EslintValidationFilter;
EslintValidationFilter.prototype = Object.create(Filter.prototype);
EslintValidationFilter.prototype.constructor = EslintValidationFilter;
EslintValidationFilter.prototype.extensions = ['js'];
EslintValidationFilter.prototype.targetExtension = 'js';

EslintValidationFilter.prototype.baseDir = function baseDir() {
  return __dirname.replace(BUILD_DIR_REGEXP, '');
};

EslintValidationFilter.prototype.cacheKeyProcessString = function cacheKeyProcessString(content, relativePath) {
  function functionStringifier(key, value) {
    if (typeof value === 'function') {
      return value.toString();
    }
    return value;
  }

  return md5Hex([
    content,
    relativePath,
    stringify(this.internalOptions, {replacer: functionStringifier}),
    stringify(this.cli.getConfigForFile(path.join(this.eslintrc, relativePath)))
  ]);
};

EslintValidationFilter.prototype.processString = function processString(content, relativePath) {
  // verify file content
  const configPath = path.join(this.eslintrc, relativePath);
  const report = this.cli.executeOnText(content, configPath);
  const filteredReport = filterAllIgnoredFileMessages(report);

  const toCache = { report, output: content };

  if (this.testGenerator && Array.isArray(filteredReport.results)) {
    const result = filteredReport.results[0] || {};
    const messages = result.messages || [];

    toCache.output = this.testGenerator(relativePath, messages, result);
  }

  return toCache;
};

/**
 * Post-process the filtered output, calculating the result severity from the report
 * if the option to `throwOnError` has been set
 *
 * @param {Object} results A results object returned from `processString` containing
 * the following properties:
 *    report {Object}: The report returned from this.cli.executeOnText()
 *    output {string}: The original file content passed to `processString` -- or the
 *      result of executing the a provided `testGenerator` function on the `report`
 *
 * @returns {Object} An object with an `.output` property, which will be
 *    used as the emitted file contents
 */
EslintValidationFilter.prototype.postProcess = function postProcess({ report, output } /* , relativePath */) {

  // if verification has result
  if (report.results.length &&
      report.results[0].messages.length) {

    // log formatter output
    this.console.log(this.formatter(report.results));

    if ('throwOnError' in this.internalOptions && this.internalOptions.throwOnError === true) {
      if (getResultSeverity(report.results[0].messages) > 0) {
        // throw error if severe messages exist
        throw new Error('rules violation with `error` severity level');
      }
    }
  }

  return {
    output
  };
};
