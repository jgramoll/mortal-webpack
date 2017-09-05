const InvalidConfig = require('./InvalidConfig')

/**
 * Dump configuration errors to STDERR and exit the process if [[compose]] fails
 * (i.e. it returned an instance of [[InvalidConfig]]).
 *
 * Example usage:
 *
 *     // file: webpack.config.js
 *     const { compose, exitOnConfigError } = require('mortal-webpack')
 *
 *     module.exports = exitOnConfigError( compose([ ... ]) )
 *
 * @param  {Object|InvalidConfig} output
 *         The output of [[compose]]. If it didn't fail, the object is returned
 *         as-is.
 *
 * @return {Object|InvalidConfig}
 */
module.exports = output => {
  if (output instanceof InvalidConfig) {
    console.error(output.toString())
    process.exit(1)

    return null
  }
  else {
    return output
  }
}