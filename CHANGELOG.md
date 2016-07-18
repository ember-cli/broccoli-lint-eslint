# 3.0.0 / 2016-06-18
- Bump `eslint` dependency to [`^3.0.0`](http://eslint.org/blog/2016/07/eslint-v3.0.0-released).

# 2.4.1 / 2016-06-17
- Bump `eslint` dependency to [`^2.13.0`](https://github.com/eslint/eslint/releases/tag/v2.13.1).

# 2.4.0 / 2016-06-09

- Pass `testGenerator` option an additional argument which is the ESLint results object.

# 2.3.0 / 2016-05-18
- Update to ESLint 2.10.2
- Improve logic that filters out [error messages related to ignored files](https://github.com/eslint/eslint/blob/2166ad475bf58a4c1fa11d5c595598d17574ffd9/lib/cli-engine.js#L305)
  - We now make sure we account for both files that are ignored by default, and files that are ignored because of a matching ignore pattern.

# 2.2.1 / 2016-04-20
- Escape path separator in RegExp used for finding directory paths (was causing issues in Windows).

# 2.2.0 / 2016-04-12
- Use broccoli-persistent-filter
- Update ignore filter message
- Accept non-string inputTrees and properly detect nested configuration files
- Fix custom rule test per [eslint/eslint#5577](https://github.com/eslint/eslint/issues/5577)

# 2.1.0 / 2016-03-20
- Updated and pinned to eslint@2.4.0.
- Begin tracking dates in CHANGELOG 😃

# 1.1.1
- Update to eslint@1.4.1

# 1.1.0
- Bump ESLint version to 1.3.1
- Fix tests from nightmare mode

# 1.0.1
- Bump ESLint version to 0.22.1

# 1.0.0
- Bump to latest

# 1.0.0-beta.5
- Fixed whitespace output issue

# 0.1.3

- Improving documentation
- Updating coding style
- Updating license

# 0.1.2

- Removing default eslint.json which allows for ESLint to lookup .eslintrc
- Updating .eslintrc
- Fixing rules path to use `rulePaths`
