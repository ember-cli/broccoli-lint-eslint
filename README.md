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

As of `3.0.0`, `broccoli-lint-eslint` uses versions of `eslint` greater than `3.0.0`. Because [`eslint@3.0.0`](http://eslint.org/blog/2016/07/eslint-v3.0.0-released) dropped support for Node versions below 4, you may need to use the latest `2.x` version of `broccoli-lint-eslint` (which uses `eslint@2.13.1`), if your support needs also fall below Node v4:

```bash
npm install --save broccoli-lint-eslint@2.4.1
```

If versions of Node >= 4 suit your needs, you can safely install the latest version of `broccoli-lint-eslint`:

```bash
npm install --save broccoli-lint-eslint
```

## Usage

```javascript
var eslint = require('broccoli-lint-eslint');
var outputNode = eslint(inputNode, options);
```

### API

* `inputNode` A [Broccoli node](https://github.com/broccolijs/broccoli/blob/master/docs/node-api.md)

* `options` {Object}

  * `format` {string|function}: The path, or function reference, to a custom formatter (See [eslint/tree/master/lib/formatters](https://github.com/eslint/eslint/tree/master/lib/formatters) for alternatives).

    Default: `'eslint/lib/formatters/stylish'`

  * `testGenerator` {`function(relativePath, errors), returns reporter output string`}: The function used to generate test modules. You can provide a custom function for your client side testing framework of choice.

    Default: `null`

    - relativePath - The relative path to the file being tested.
    - errors - An array of eslint error objects found.

    Example usage:

    ```javascript
    var path = require('path');

    function testGenerator(relativePath, errors) {
      return "module('" + path.dirname(relativePath) + "');" +
             "test('" + relativePath + "' should pass eslint', function() { " +
             "  ok(passed, moduleName" + "should pass eslint." + (errors ? "\n" + errors : "") + ");  " +
             "});"
    };

    return eslint(inputNode, {
      options: {
        configFile: this.eslintrc.app + '/eslint.json',
        rulesdir: this.eslintrc.app
      },
      testGenerator: testGenerator
    });
    ```

  * `throwOnError` {boolean}: Cause exception error on first severe error.

    Default: `false`

  * `persist` {boolean}: Persist the state of filter output across restarts

    Default: `false`

  * `console`: {Object}: A custom console object with a `log` method for
  `broccoli-lint-eslint` to use when logging formatter output.

    Default: The global `console` object

  * `options` {Object}: [Options native to ESLint CLI](http://eslint.org/docs/developer-guide/nodejs-api#cliengine) that `broccoli-lint-eslint` makes use of:

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
[travis-badge]: https://img.shields.io/travis/ember-cli/broccoli-lint-eslint/master.svg?label=TravisCI
[travis-badge-url]: https://travis-ci.org/ember-cli/broccoli-lint-eslint
[license-badge]: https://img.shields.io/npm/l/broccoli-lint-eslint.svg
[license-badge-url]: LICENSE.md
[dependencies-badge]: https://img.shields.io/david/ember-cli/broccoli-lint-eslint.svg
[dependencies-badge-url]: https://david-dm.org/ember-cli/broccoli-lint-eslint
[devDependencies-badge]: https://img.shields.io/david/dev/ember-cli/broccoli-lint-eslint.svg
[devDependencies-badge-url]: https://david-dm.org/ember-cli/broccoli-lint-eslint#info=devDependencies
