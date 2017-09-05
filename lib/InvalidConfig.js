/**
 * @class InvalidConfig
 * @protected
 *
 * A class representing an invalid configuration with a reference to the errors
 * that cause it to be invalid.
 *
 * @param {Array.<String>} errors
 */
function InvalidConfig(errors) {
  /**
   * @property {Array.<String>} errors
   *           A list of error messages that were collected while applying
   *           directives.
   */
  this.errors = errors;
}

/**
 * Pretty-print the errors. If the list contains more than one error, each's
 * message will be prefixed by the index.
 *
 * @return {String}
 */
InvalidConfig.prototype.toString = function() {
  if (this.errors.length === 1) {
    return this.errors[0]
  }
  else {
    return this.errors.map((error, index) => `${index+1}. ${error}`).join('\n')
  }
}

module.exports = InvalidConfig