'use strict';

/* eslint global-require: 0, consistent-return: 0 */

const Filter = require('broccoli-persistent-filter');
const CLIEngine = require('eslint').CLIEngine;
const md5Hex = require('md5-hex');
const stringify = require('json-stable-stringify');
const path = require('path');
const escapeStringRegexp = require('escape-string-regexp');
const BUILD_DIR_REGEXP = new RegExp(`(${escapeStringRegexp(path.sep)})?lib(${escapeStringRegexp(path.sep)})?$`);

/**
 * Calculates the severity of a eslint.linter.verify result
 * @param {Array} resultMessages ESLint's verify() result array
 *    @see: http://eslint.org/docs/developer-guide/nodejs-api#linter
 *
 * @returns {Number} accumulatedSeverity The total severity from of the list of results
 *    0 indicates all-clear
 *    1 indicates a warning-level result
 *    > 1 indicates an error-level result
 */
function getResultSeverity() {
  let resultMessages = arguments[0] || [];

  return resultMessages.reduce((accumulatedSeverity, message) => {
    const severity = message.severity || 0;

    if (message.fatal || severity === 2) {
      return accumulatedSeverity + 2;
    }

    return accumulatedSeverity + severity;
  }, 0);
}

function isString(x) {
  return toString.call(x) === '[object String]';
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
function EslintValidationFilter(inputNode) {
  let options = arguments[1] || {};

  if (!(this instanceof EslintValidationFilter)) {
    return new EslintValidationFilter(inputNode, options);
  }

  this.internalOptions = options || {};
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

  if (isString(this.internalOptions.testGenerator)) {
    const testGenerators = require('./test-generators');

    this.testGenerator = testGenerators[this.internalOptions.testGenerator];
    if (!this.testGenerator) {
      throw new Error(`Could not find '${this.internalOptions.testGenerator}' test generator.`);
    }
  } else {
    this.testGenerator = this.internalOptions.testGenerator;
  }

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

  const filePath = path.join(this.eslintrc, relativePath);
  const isIgnoredFile = this.cli.isPathIgnored(filePath);

  return md5Hex([
    content,
    relativePath,
    isIgnoredFile.toString(),
    stringify(this.internalOptions, { replacer: functionStringifier }),
    stringify(this.cli.getConfigForFile(filePath))
  ]);
};

EslintValidationFilter.prototype.getDestFilePath = function getDestFilePath(relativePath) {
  //This method gets called for all files in the tree, so we call the superclass to filter
  //based on the extensions property.
  const filterPath = Filter.prototype.getDestFilePath.call(this, relativePath);
  const fullPath = path.join(this.eslintrc, relativePath);

  if (filterPath && !this.cli.isPathIgnored(fullPath)) {
    return filterPath;
  } else {
    return null;
  }
};

EslintValidationFilter.prototype.processString = function processString(content, relativePath) {
  // verify file content
  const configPath = path.join(this.eslintrc, relativePath);
  const report = this.cli.executeOnText(content, configPath);

  const toCache = { report, output: content };

  if (this.testGenerator && Array.isArray(report.results)) {
    const result = report.results[0] || {};
    const messages = result.messages || [];

    toCache.output = this.testGenerator(relativePath, messages, result);
  }

  return toCache;
};

/**
 * Post-process the filtered output, calculating the result severity from the report
 * if the option to `throwOnError` has been set
 *
 * @param {Object} results A results object returned from `processString`
 * @param {Object} results.report The report returned from this.cli.executeOnText()
 * @param {string} results.output The original file content passed to `processString` -- or the
 *      result of executing the a provided `testGenerator` function on the `report`
 *
 * @returns {Object} An object with an `.output` property, which will be
 *    used as the emitted file contents
 */
EslintValidationFilter.prototype.postProcess = function postProcess(results /* , relativePath */) {
  let report = results.report;

  // if verification has result
  if (report.results.length &&
      report.results[0].messages.length) {

    // log formatter output
    this.console.log(this.formatter(report.results));

    const throwOnWarn = !!this.internalOptions.throwOnWarn;
    const throwOnError = !!this.internalOptions.throwOnError;

    if (throwOnWarn || throwOnError) {
      const resultSeverity = getResultSeverity(report.results[0].messages);

      if (resultSeverity === 1 && throwOnWarn) {
        throw new Error('rules violation with `warn` severity level');
      }

      if (resultSeverity >= 2 && (throwOnWarn || throwOnError)) {
        throw new Error('rules violation with `error` severity level');
      }
    }
  }

  return { output: results.output };
};
