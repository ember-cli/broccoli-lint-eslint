# broccoli-eslint

Runs [Eslint](http://eslint.org/) verification and logs result.

## Installation

```bash
npm install --save broccoli-eslint
```

## Usage

Note: The API will change in subsequent 0.x versions.

```js
var eslintFilter = require('broccoli-eslint');
var applicationJs = eslintFilter(sourceTree, {
  config: './eslint.json'
});
```

### Options

* `.config` (String): Path to a eslint configuration file