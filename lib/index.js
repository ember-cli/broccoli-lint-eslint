/* eslint global-require: 0, consistent-return: 0 */

const Filter = require('broccoli-filter');
const CLIEngine = require('eslint').CLIEngine;
const path = require('path');

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
  const ignoreRegex = /File ignored because of a matching ignore pattern\. Use --no-ignore to override\./;

  return errors.filter((error) => {
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
  const resultOutput = result;

  result.results.forEach((resultItem) => {
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
  this.eslintOptions = options.options || {};

  // default ignore:true option
  if (typeof this.eslintOptions.ignore === 'undefined') {
    this.eslintOptions.ignore = true;
  }

  // call base class constructor
  Filter.call(this, inputNode);

  // set formatter
  if (typeof this.options.format === 'function') {
    this.formatter = this.options.format;
  } else {
    // eslint-disable-next-line global-require
    this.formatter = require(this.options.format || 'eslint/lib/formatters/stylish');
  }

  this.cli = new CLIEngine(this.eslintOptions);

  this.eslintrc = resolveInputDirectory(inputNode);

  this.testGenerator = options.testGenerator;
  if (this.testGenerator) {
    this.targetExtension = 'lint-test.js';
  }
}

module.exports = EslintValidationFilter;
EslintValidationFilter.prototype = Object.create(Filter.prototype);
EslintValidationFilter.prototype.constructor = EslintValidationFilter;
EslintValidationFilter.prototype.extensions = ['js'];
EslintValidationFilter.prototype.targetExtension = 'js';

EslintValidationFilter.prototype.processString = function processString(content, relativePath) {
  'use strict'; // eslint-disable-line strict

  // verify file content
  const configPath = path.join(this.eslintrc, relativePath);
  const output = this.cli.executeOnText(content, configPath);
  const filteredOutput = filterAllIgnoredFileMessages(output);

  // if verification has result
  if (filteredOutput.results.length &&
      filteredOutput.results[0].messages.length) {

    // log formatter output
    console.log(this.formatter(filteredOutput.results));

    if (getResultSeverity(filteredOutput.results) > 0) {
      if ('throwOnError' in this.internalOptions && this.internalOptions.throwOnError === true) {
        // throw error if severe messages exist
        throw new Error('severe rule errors');
      }
    }
  }

  if (this.testGenerator) {
    let messages = [];

    if (filteredOutput.results.length) {
      messages = filteredOutput.results[0].messages || [];
    }

    return this.testGenerator(relativePath, messages);
  }

  // return unmodified string
  return content;
};
