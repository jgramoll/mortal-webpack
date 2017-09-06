/**
 * @class
 *
 * A class representing an invalid configuration and contains a reference to the
 * errors that cause it to be invalid.
 *
 * An instance of this class is returned from [[compose]] in case a
 * configuration error occurred.
 *
 * See [[reportErrors]] for pretty-printing this object into an error report.
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

module.exports = InvalidConfig