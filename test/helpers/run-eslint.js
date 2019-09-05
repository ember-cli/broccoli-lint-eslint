const broccoli = require('broccoli');
const pFinally = require('p-finally');
const eslintValidationFilter = require('../../');

module.exports = function runEslint(path, _options) {
  const options = _options || {};
  const buildLog = [];

  // default options
  // eslint-disable-next-line global-require, newline-after-var
  const formatter = require(options.format || 'eslint/lib/cli-engine/formatters/compact');
  options.format = function spyFormatter(results) {
    buildLog.push(formatter(results));
    // prevent console spew
    return '';
  };
  options.options = options.options || {};

  const node = eslintValidationFilter.create(path, options);
  const builder = new broccoli.Builder(node);
  const promise = builder.build().then(() => ({
    buildLog: buildLog.join('\n'),
    outputPath: node.outputPath,
  }));

  pFinally(promise, () => builder.cleanup());

  return promise;
};
