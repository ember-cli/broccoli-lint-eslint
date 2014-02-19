# [broccoli](https://github.com/joliss/broccoli)-eslint

> Lint JavaScript using [Eslint](http://eslint.org/)

## Install

```bash
npm install --save broccoli-eslint
```

## Example

Note: The API will change in subsequent 0.x versions.

```js
var eslint = require('broccoli-eslint');
tree = eslint(tree, options);
```

## API

### eslint(tree, options)

#### options

##### config

Type: `String`
Default: `./eslint.json`

Path to eslint configuration file.
