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
function getResultSeverity(result) {

  // count all errors
  return result.reduce((previous, message) => {
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
 * Uses the content of each file in a given tree and runs eslint validation on it.
 * @param {Object} inputNode Tree from broccoli.makeTree
 * @param {{config: String, rulesdir: String, format: String}} options Filter options
 * @returns {EslintValidationFilter} Filter obconfig @constructor
 */
function EslintValidationFilter(inputNode, options) {
  if (!(this instanceof EslintValidationFilter)) {
    return new EslintValidationFilter(inputNode, options);
  }

  this.options = options || {};
  const eslintOptions = this.options.options || {};

  // default ignore:true option
  if (typeof eslintOptions.ignore === 'undefined') {
    eslintOptions.ignore = true;
  }

  // default is to persist filter output
  if (typeof this.options.persist === 'undefined') {
    this.options.persist = true;
  }

  // call base class constructor
  Filter.call(this, inputNode, this.options);

  // set formatter
  if (typeof this.options.format === 'function') {
    this.formatter = this.options.format;
  } else {
    // eslint-disable-next-line global-require
    this.formatter = require(this.options.format || 'eslint/lib/formatters/stylish');
  }

  this.cli = new CLIEngine(eslintOptions);

  this.eslintrc = resolveInputDirectory(inputNode);

  this.testGenerator = this.options.testGenerator;
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
    stringify(this.options, {replacer: functionStringifier}),
    stringify(this.cli.getConfigForFile(path.join(this.eslintrc, relativePath)))
  ]);
};

EslintValidationFilter.prototype.processString = function processString(content, relativePath) {
  // verify file content
  const configPath = path.join(this.eslintrc, relativePath);
  const output = this.cli.executeOnText(content, configPath);
  const filteredOutput = filterAllIgnoredFileMessages(output);
  const toCache = {
    lint: output,
    output: content
  };

  if (this.testGenerator && Array.isArray(filteredOutput.results)) {
    const result = filteredOutput.results[0] || {};
    const messages = result.messages || [];

    toCache.output = this.testGenerator(relativePath, messages, result);
  }

  return toCache;
};

EslintValidationFilter.prototype.postProcess = function postProcess(fromCache) {
  const lint = fromCache.lint;
  const output = fromCache.output;

  // if verification has result
  if (lint.results.length &&
      lint.results[0].messages.length) {

    // log formatter output
    console.log(this.formatter(lint.results));

    if (getResultSeverity(lint.results) > 0) {
      if ('throwOnError' in this.internalOptions && this.internalOptions.throwOnError === true) {
        // throw error if severe messages exist
        throw new Error('severe rule errors');
      }
    }
  }

  return {
    output
  };
};
