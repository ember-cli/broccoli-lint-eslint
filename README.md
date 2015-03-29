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

### eslint(tree, options, internalOptions)

#### options

##### config

Type: `String`
Default: `./eslint.json`

Path to eslint configuration file.

##### rulesdir

Type: `String`
Default: [built-in rules directory](https://github.com/eslint/eslint/tree/master/lib/rules)

Path to a directory with custom rules. Your custom rules will be used in addition to the built-in ones.

Recommended read: [Working with Rules](https://github.com/eslint/eslint/blob/master/docs/developer-guide/working-with-rules.md)

##### format

Type: `String`
Default: `'eslint/lib/formatters/stylish'`

Path path to a custom formatter (See [eslint/tree/master/lib/formatters](https://github.com/eslint/eslint/tree/master/lib/formatters) for alternatives).

#### internalOptions
##### throwOnError

Type: `Boolean`

Cause exception error on first severe error
