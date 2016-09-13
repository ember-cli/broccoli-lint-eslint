# broccoli-lint-eslint

[![Latest NPM release][npm-badge]][npm-badge-url]
[![TravisCI Build Status][travis-badge]][travis-badge-url]
[![License][license-badge]][license-badge-url]
[![Dependencies][dependencies-badge]][dependencies-badge-url]
[![Dev Dependencies][devDependencies-badge]][devDependencies-badge-url]


> Lint JavaScript with [ESLint][eslint] as part of your [Broccoli][broccoli] build pipeline.


Most of the test setup and the build configuration is based on [sindresorhus/grunt-eslint](https://github.com/sindresorhus/grunt-eslint).
The internal validation is heavily inspired by [eslint cli.js](https://github.com/eslint/eslint/blob/master/lib/cli.js).

## Installation

```bash
npm install broccoli-lint-eslint@2
```

## Usage

```javascript
var eslint = require('broccoli-lint-eslint');
var outputNode = eslint(inputNode, options);
```

### API

* `inputNode` A [Broccoli node](https://github.com/broccolijs/broccoli/blob/master/docs/node-api.md)

* `options` {Object}: Options to control how `broccoli-lint-eslint` is run.
  * `format` {string|function}: The path, or function reference, to a custom formatter (See [eslint/tree/master/lib/formatters](https://github.com/eslint/eslint/tree/master/lib/formatters) for alternatives).

    Default: `'eslint/lib/formatters/stylish'`

  * `testGenerator` {`string|function(relativePath, errors), returns reporter output string`}: The function used to generate test modules. You can provide a custom function for your client side testing framework of choice.

    Default: `null`

    If you provide a `string` one of the [predefined test generators](lib/test-generators.js) is used. Currently supported are `qunit` and `mocha`.

    Example usage:

    ```javascript
    var path = require('path');

    function testGenerator(relativePath, errors) {
      return "module('" + path.dirname(relativePath) + "');\n";
             "test('" + relativePath + "' should pass ESLint', function() {\n" +
             "  ok(" + passed + ", '" + moduleName + " should pass ESLint." + (errors ? "\\n" + errors : '') + "');\n" +
             "});\n";
    };

    return eslint(inputNode, {
      options: {
        configFile: this.jshintrc.app + '/eslint.json',
        rulesdir: this.jshintrc.app
      },
      testGenerator: testGenerator
    });
    ```

  * `throwOnError` {boolean}: Cause exception error on first violation with `error`-level severity.

    Default: `false`

  * `throwOnWarn` {boolean}: Cause exception error on first violation with `warn`-level severity.
  _NOTE_: Setting this to true will automatically enable `throwOnError` behavior.

    Default: `false`

  * `options` {options}: [Options native to ESLint CLI](http://eslint.org/docs/developer-guide/nodejs-api#cliengine). While all options will be passed to the [ESLint CLIEngine](http://eslint.org/docs/developer-guide/nodejs-api#cliengine), these are the ones that `broccoli-lint-eslint` makes use of in particular:

    * `configFile` {string}: Path to eslint configuration file.

        Default: `./eslintrc`

    * `rulePaths` {Array}: Paths to a directory with custom rules. Your custom rules will be used in addition to the built-in ones. Recommended read: [Working with Rules](https://github.com/eslint/eslint/blob/master/docs/developer-guide/working-with-rules.md).

      Default: [built-in rules directory](https://github.com/eslint/eslint/tree/master/lib/rules)

    * `ignore` {boolean}: `false` disables use of `.eslintignore`, `ignorePath` and `ignorePattern`

      Default: `true`

[eslint]: http://eslint.org/
[broccoli]: https://github.com/joliss/broccoli

<!-- Badging -->
[npm-badge]: https://img.shields.io/npm/v/broccoli-lint-eslint.svg
[npm-badge-url]: https://www.npmjs.com/package/broccoli-lint-eslint
[travis-badge]: https://img.shields.io/travis/ember-cli/broccoli-lint-eslint/2.x.svg?label=TravisCI
[travis-badge-url]: https://travis-ci.org/ember-cli/broccoli-lint-eslint
[license-badge]: https://img.shields.io/npm/l/broccoli-lint-eslint.svg
[license-badge-url]: LICENSE.md
[dependencies-badge]: https://img.shields.io/david/ember-cli/broccoli-lint-eslint.svg
[dependencies-badge-url]: https://david-dm.org/ember-cli/broccoli-lint-eslint
[devDependencies-badge]: https://img.shields.io/david/dev/ember-cli/broccoli-lint-eslint.svg
[devDependencies-badge-url]: https://david-dm.org/ember-cli/broccoli-lint-eslint#info=devDependencies
