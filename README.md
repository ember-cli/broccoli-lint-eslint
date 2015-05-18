# [broccoli](https://github.com/joliss/broccoli)-lint-eslint

> Lint JavaScript using [Eslint](http://eslint.org/)

This is a fork of [makepanic/broccoli-eslint](https://github.com/makepanic/broccoli-eslint) used to add new features and keep up to date with the latest ESLint. This fork may go away however it will track any API changes made to it's fork as long as possible.
Most of the test setup and the build configuration is based on [sindresorhus/grunt-eslint](https://github.com/sindresorhus/grunt-eslint).
The internal validation is heavily inspired by [eslint cli.js](https://github.com/eslint/eslint/blob/master/lib/cli.js)

## Install

```bash
npm install --save broccoli-lint-eslint
```

## Example

Note: The API will change in subsequent 0.x versions.

```js
var eslint = require('broccoli-lint-eslint');
tree = eslint(tree, options);
```

## API

### eslint(tree, options)

#### options

##### format

Type: `String`
Default: `'eslint/lib/formatters/stylish'`

Path path to a custom formatter (See [eslint/tree/master/lib/formatters](https://github.com/eslint/eslint/tree/master/lib/formatters) for alternatives).

##### testGenerator

Type: `function`
Default: `null`

The function used to generate test modules. You can provide a custom function for your client side testing framework of choice.

The function receives the following arguments:

- relativePath - The relative path to the file being tested.
- errors - An array of eslint error objects found.

Example usage:
```
var path = require('path');

function testGenerator(relativePath, errors) {
  return "module('" + path.dirname(relativePath) + '");";
         "test('" + relativePath + "' should pass jshint', function() { " +
         "  ok(passed, moduleName+" should pass jshint."+(errors ? "\n"+errors : '')); " +
         "});
};

return eslint(tree, {
  options: {
    configFile: this.jshintrc.app + '/eslint.json',
    rulesdir: this.jshintrc.app
  },
  testGenerator: testGenerator
});
```

##### throwOnError

Type: `Boolean`

Cause exception error on first severe error

##### options
Options native to ESLint CLI: [CLIEngine options](http://eslint.org/docs/developer-guide/nodejs-api#cliengine)

###### configFile

Type: `String`
Default: `./.eslintrc`

Path to eslint configuration file.

###### rulePaths

Type: `Array`
Default: [built-in rules directory](https://github.com/eslint/eslint/tree/master/lib/rules)

Paths to a directory with custom rules. Your custom rules will be used in addition to the built-in ones.

Recommended read: [Working with Rules](https://github.com/eslint/eslint/blob/master/docs/developer-guide/working-with-rules.md)
