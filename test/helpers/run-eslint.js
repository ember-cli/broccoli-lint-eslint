const broccoli = require('broccoli');
const eslint = require('../../index');

module.exports = function runEslint(path, _options) {
  const options = _options || {};
  const buildLog = [];
  const consoleLog = console.log;

  // stub console.log so we can get the formatter's output
  console.log = function appendToBuildLog(...args) {
    const text = args.join(' ');

    buildLog.push(text);
  };

  // default options
  options.format = options.format || 'eslint/lib/formatters/compact';
  options.options = options.options || {};
  options.options.ignore = options.options.ignore || false;

  const tree = eslint(path, options);
  const builder = new broccoli.Builder(tree);
  const promise = builder.build().then(function builderThen() {
    return {buildLog: buildLog.join('\n'), outputPath: tree.outputPath};
  });

  promise.finally(function builderCleanup() {
    builder.cleanup();

    // restore the original console.log
    console.log = consoleLog;
  });

  return promise;
};
