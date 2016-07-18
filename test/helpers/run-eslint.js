const broccoli = require('broccoli');
const eslintValidationFilter = require('../../index');

module.exports = function runEslint(path, _options) {
  const options = _options || {};
  const buildLog = [];

  // default options
  // eslint-disable-next-line global-require, newline-after-var
  const formatter = require(options.format || 'eslint/lib/formatters/compact');
  options.format = function spyFormatter(results) {
    buildLog.push(formatter(results));
    // prevent console spew
    return '';
  };
  options.options = options.options || {};

  const tree = eslintValidationFilter(path, options);
  const builder = new broccoli.Builder(tree);
  const promise = builder.build().then(function builderThen() {
    return { buildLog: buildLog.join('\n'), outputPath: tree.outputPath };
  });

  promise.finally(function builderCleanup() {
    builder.cleanup();
  });

  return promise;
};
