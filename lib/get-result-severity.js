'use strict';

/**
 * Calculates the severity of a eslint.linter.verify result
 * @param {Array} resultMessages ESLint's verify() result array
 *    @see: http://eslint.org/docs/developer-guide/nodejs-api#linter
 *
 * @returns {Number} accumulatedSeverity The total severity from of the list of results
 *    0 indicates all-clear
 *    1 indicates a warning-level result
 *    > 1 indicates an error-level result
 */
function getResultSeverity() {
  let resultMessages = arguments[0] || [];

  return resultMessages.reduce((accumulatedSeverity, message) => {
    const severity = message.severity || 0;

    if (message.fatal || severity === 2) {
      return accumulatedSeverity + 2;
    }

    return accumulatedSeverity + severity;
  }, 0);
}

module.exports = getResultSeverity;
