const InvalidConfig = require('./InvalidConfig')
const { curry, pipe } = require('ramda')
const stackTrace = require('stack-trace')
const columnify = require('columnify')
const path = require('path')

const capitalize = x => x.slice(0,1).toUpperCase().concat(x.slice(1))

const addNewLineToEnd = x => `${x}\n${Array('Error'.length).fill('-').join('')}`
const omitControlChars = x => x.replace(/\x1b\[\d{2}m/g, '').replace(/\x1b\[0m/g, '')
const underscore = x => `${x}\n${Array(omitControlChars(x).length).fill('-').join('')}`
const blue = string => `\x1b[36m${string}\x1b[0m`

/**
 * @module reportErrors
 * @type {Function}
 *
 * Generate a human-readable error report from an [[invalid config | InvalidConfig]]
 * object.
 *
 * mortal-webpack is designed not to throw exceptions. However, it is your
 * responsibility to make sure errors do not get through without reporting
 * them to the user.
 *
 * It is recommended that you pass the output of your calls to [[compose]]
 * through this function. If the config is valid, this function will do nothing,
 * otherwise it will report the errors to the user. You can tweak the reporting
 * behavior through a few options explained below.
 *
 * Example usage:
 *
 *     // file: webpack.config.js
 *     const { compose, reportErrors } = require('mortal-webpack')
 *
 *     module.exports = reportErrors({ exit: true })(compose([ ... ]))
 *
 * Sample output:
 *
 *     Error                                                        | Location
 *     -----                                                        | --------
 *     Target requires NODE_ENV to be set to "development" while it | /webpack/targets/vendor-dll.js:5
 *     is set to "test". Please re-run by sourcing                  |
 *     NODE_ENV=development into the environment.                   |
 *     -----                                                        |
 *     You must pass a pattern (a string or a RegExp) to "compile". | /webpack/targets/vendor-dll.js:50
 *
 * @param {Object} options
 *        Reporting options
 *
 * @param {Boolean} [options.exit=true]
 *        Exit the process with return code 1 on errors.
 *
 * @param {String} [options.context=process.cwd()]
 *        A path to a directory that would be stripped from the reported
 *        location. This is used to make the location strings shorter and more
 *        meaningful.
 *
 *        If the default is not working for you (e.g. the absolute path to the
 *        files is being reported) then you should specify this with the root of
 *        your project (which consequently would be equal to
 *        [[builders.context]] if you've called that, but we can't re-use it
 *        here.)
 *
 * @param {Array.<FilePattern>} [options.traceFileBlacklist=[]]
 *        List of files to ignore when locating the file the error originated
 *        from.
 *
 *        This may be necessary to configure in order to get more accurate
 *        results on where the error originated from to help the user locate
 *        it quickly.
 *
 *        By default, this routine uses something that looks like an Error stack
 *        trace to find out which function / file the error originated from. It
 *        excludes any file that comes from "mortal-webpack" because they're not
 *        relevant. However, if you're defining [[macros | ../examples/macros.md]]
 *        and your build scripts call those APIs instead of [[builders]] directly,
 *        you should list the file paths of those macros here to also exclude
 *        them.
 *
 *
 * @param {function(String): void} [options.write=console.error]
 *        Function that is responsible for reporting the errors to the user.
 *        The default is to log them using `console.error()`.
 *
 * @param  {Config|InvalidConfig} output
 *         The output of [[compose]]. If it didn't fail, the object is returned
 *         as-is.
 *
 * @return {Config|InvalidConfig}
 */
module.exports = curry(({ context = process.cwd(), exit = true, traceFileBlacklist = [], write = console.error }, output) => {
  if (!(output instanceof InvalidConfig)) {
    return output;
  }

  write(dumpErrors({ context, traceFileBlacklist }, output))

  if (exit) {
    process.exit(1)
  }

  return null
})

function dumpErrors(config, output) {
  return columnify(output.errors.map(error => dumpError(config, error)), {
    columns: ['location', 'error'],
    columnSplitter: ' | ',
    config: {
      error: {
        maxWidth: 62,
        headingTransform: pipe(capitalize, blue, underscore),
        dataTransform: addNewLineToEnd,
      },
      location: {
        headingTransform: pipe(capitalize, blue, underscore),
      }
    }
  })
}

function dumpError({ context, traceFileBlacklist }, { message, location }) {
  return {
    error: message,
    location: resolveCallerLocation({ context, traceFileBlacklist }, location)
  }
}

function resolveCallerLocation({ context, traceFileBlacklist }, error) {
  const trace = stackTrace.parse(error)
  const isListed = fileName => pattern => fileName.match(pattern)

  const callerTrace = trace.find(x => {
    const fileName = x.getFileName()

    return (
      path.dirname(fileName) !== __dirname &&
      !traceFileBlacklist.some(isListed(fileName))
    )
  })

  const omitContext = fileName => {
    if (context && fileName.indexOf(context) === 0) {
      return fileName.slice(context.length)
    }
    else {
      return fileName
    }
  }

  return `${omitContext(callerTrace.getFileName())}:${callerTrace.getLineNumber()}`
}