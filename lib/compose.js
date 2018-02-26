const webpack = require('webpack')
const InvalidConfig = require('./InvalidConfig')
const {
  assign,
  curry,
  flatten,
  flow,
  last,
} = require('./utils')

module.exports = curry((params, directives) => compose(params, flatten(directives)))

/**
 * @module
 *
 * The primary routine of `mortal-webpack`: turn a bunch of [[build directives |
 * builders]] into a [webpack
 * configuration](https://webpack.github.io/docs/configuration.html) object.
 *
 * Example usage:
 *
 *     const { compose, builders: b } = require('mortal-webpack')
 *
 *     const webpackConfig = compose([
 *       b.output({ path: 'dist/' }),
 *
 *       b.generateCommonBundle({
 *         name: 'vendor',
 *         modules: [ 'lodash', 'react' ]
 *       }),
 *
 *       b.generateBundle({
 *         name: 'application',
 *         modules: [ 'src/index.js' ]
 *       })
 *     ])
 *
 * @param {Object} options
 * @param {Object?} options.happyPackOptions If you choose to enable
 *        [happypack](https://github.com/amireh/happypack) for [[compiling |
 *        builders.compile]] then you should pass the common options to the
 *        plugins here, like `threadPool: HappyThreadPool` or `threads: Number`.
 *
 * @param {Array.<Directive>} directives
 *        The list of directives that describe what the configuration should
 *        contain.
 *
 *        This list is flattened before consumption in order to allow for
 *        builders and macros to return multiple directives from the same
 *        API.
 *
 *        For example, the following two calls are equivalent:
 *
 *            compose([
 *              [ b.output({}) ]
 *            ])
 *
 *            compose([
 *              b.output({})
 *            ])
 *
 *        Please keep in mind that every item in this list must be a [[Directive]]
 *        and can not be falsey; if you need to conditionally add a directive,
 *        use helpers like [[builders.when]] and [[builders.whenEnv]].
 *
 *            compose([
 *              // OK:
 *              b.when(someCondition, [
 *                b.devTool('eval')
 *              ])
 *
 *              // NOT OK! don't do this
 *              someCondition && [
 *                b.devTool('eval')
 *              ]
 *            ])
 *
 *         The reason for this is that we always want to evaluate the directives
 *         to make the output more predictable. Short-circuiting using the `&&`
 *         operator prohibits us from doing that.
 *
 * @return {Config|InvalidConfig}
 *         The configuration object that can be passed to webpack.
 *
 *         In the case of an error, an instance of [[InvalidConfig]] will be
 *         returned which you can utilize to let the user know what went wrong.
 *
 */
const compose = ({ happyPackOptions }, directives) => {
  const failures = checkInvariants(directives)

  if (failures.length) {
    return new InvalidConfig(failures);
  }

  directives.filter(byName('message')).map(getProps).forEach(message => {
    console.log(message)
  });

  return {
    devtool: setDevTool(directives),
    devServer: configureDevServer(directives),
    context: setContext(directives),
    entry: composeEntries(directives),
    externals: defineExternals(directives),
    mode: setMode(directives),
    module: {
      noParse: filterModuleNoParse(directives),
      rules: flow([
        filterModuleRules(directives),
        filterIstanbul(directives)
      ])([])
    },
    node: composeNode(directives),
    optimization: {
      minimize: !!last(directives.filter(byName('optimize-js'))) || false,
      splitChunks: setSplitChunks(directives)
    },
    output: composeOutput(directives),
    plugins: flow([
      defineDLLs(directives),
      defineRuntimeConstants(directives),
      generateHTMLFiles(directives),
      installHappyPacks(happyPackOptions, directives),
      installSortingPlugin(directives),
      maybeBreakOnError(directives),
      useDLLs(directives),
      useCustomPlugins(directives),
    ])([]),
    resolve: composeResolve(directives),
    resolveLoader: composeResolveLoader(directives),
    watch: composeWatch(directives),
    watchOptions: composeWatchOptions(directives),
  }
}

const byName = name => x => x.name === name
const getProps = x => x.params

const checkInvariants = directives => {
  return directives.filter(byName('invariant')).map(getProps).reduce((errors, { predicate, message, location }) => {
    const held = typeof predicate === 'function' ? predicate() : predicate

    // TODO: we may want to expose a separate API to compose like "check" that
    // returns a list of errors instead of deciding to terminate the process
    // ourselves
    if (!held) {
      return errors.concat({ message, location })
    }
    else {
      return errors
    }
  }, [])
}

const composeOutput = directives => {
  const acceptOutput = object => directives.filter(byName('output')).map(getProps).reduce(function(_, d) {
    return assign({}, d)
  }, object)

  const setLibraryNameForDLL = object => {
    const dllDefinition = last( directives.filter(byName('define-dll')).map(getProps) )

    if (dllDefinition) {
      return assign(object, { library: dllDefinition.name })
    }
    else {
      return object
    }
  }

  const enableDevServer = object => {
    return directives
      .filter(byName('dev-server'))
      .map(getProps)
      .filter(d => d.host)
      .reduce(function(map, d) {
        const publicPath = object.publicPath || '/'

        return assign(map, {
          publicPath: `${d.host}${publicPath}`
        })
      }, object)
  }

  return flow([ acceptOutput, setLibraryNameForDLL, enableDevServer ])({})
}

const composeResolve = directives => {
  const resolveDirective = last(directives.filter(byName('resolve')).map(getProps)) || {}

  return {
    extensions: resolveDirective.extensions,
    modules: resolveDirective.directories,
    alias: composeAliases(directives.filter(byName('alias')))
  }
}

const composeAliases = directives => {
  return directives.map(getProps).reduce(function(map, d) {
    return assign(map, d)
  }, {})
}

const composeResolveLoader = directives => {
  const directive = last(directives.filter(byName('resolve-loader')).map(getProps)) || {}

  return {
    modules: directive.directories,
    extensions: directive.extensions,
    // modulesDirectories: directive.relativeDirectories,
    // packageMains: directive.packageMains,
    // moduleTemplates: directive.moduleTemplates,
    alias: composeAliases(directives.filter(byName('alias-loader')))
  }
}

const defineRuntimeConstants = directives => plugins => {
  return plugins.concat(directives.filter(byName('runtime-constants')).map(getProps).map(mapping => {
    return new webpack.DefinePlugin(Object.keys(mapping).reduce(function(map, key) {
      return assign(map, { [key]: JSON.stringify(mapping[key]) })
    }, {}))
  }))
}

const installSortingPlugin = directives => plugins => {
  if (directives.some(byName('sort-bundle-modules'))) {
    return plugins.concat(new webpack.optimize.OccurrenceOrderPlugin())
  }
  else {
    return plugins;
  }
}

const setContext = directives => {
  return last(
    directives.filter(byName('context')).map(getProps)
  )
}

const setDevTool = directives => {
  const devToolDirective = last(directives.filter(byName('dev-tool')))

  if (devToolDirective) {
    return getProps(devToolDirective)
  }
  else if (directives.some(byName('source-maps'))) {
    return 'source-map'
  }
  else {
    return undefined
  }
}

const composeEntries = directives => {
  return directives.filter(byName('bundle'))
    .map(getProps)
    .reduce(function(map, d) {
      return assign(map, { [d.name]: d.modules })
    }, {})
}

const composeWatch = directives => {
  return directives.some(byName('watch')) || undefined
}

const composeWatchOptions = directives => {
  return directives.filter(byName('watch')).map(getProps).reduce((map, d) => {
    return assign(map, d)
  }, {})
}

const generateHTMLFiles = directives => plugins => {
  return plugins.concat(
    directives.filter(byName('html-file')).map(getProps).map(options => {
      const HtmlWebpackPlugin = require('html-webpack-plugin')

      return new HtmlWebpackPlugin(options)
    })
  )
}

const installHappyPacks = (happyPackOptions, directives) => plugins => {
  return plugins.concat(
    directives
      .filter(byName('rule'))
      .map(getProps)
      .filter(x => x.happy)
      .map(rule => {
        const HappyPack = require('happypack');

        return new HappyPack(assign(happyPackOptions, {
          id: rule.happyId,
          loaders: rule.loaders.map(getProps).map(composeLoader),
        }))
      })
  )
}

const useDLLs = directives => plugins => {
  return plugins.concat(
    directives.filter(byName('dll')).map(getProps).map(d => {
      return new webpack.DllReferencePlugin({
        context: d.context,
        manifest: require(d.path),
      })
    })
  )
}

const defineDLLs = directives => plugins => {
  return plugins.concat(
    directives.filter(byName('define-dll')).map(getProps).map(d => {
      return new webpack.DllPlugin({
        name: d.name,
        path: d.path,
      })
    })
  )
}

const setSplitChunks = directives => {
  const commonChunks = last(directives.filter(byName('common-chunks')).map(getProps))
  return commonChunks || false
}

const maybeBreakOnError = directives => plugins => {
  if (directives.some(byName('dont-emit-on-error'))) {
    return plugins.concat(new webpack.NoEmitOnErrorsPlugin())
  }
  else {
    return plugins;
  }
}

const filterModuleNoParse = directives => {
  const result = directives.filter(byName('dont-parse'))
    .map(getProps)
    .reduce(function(list, x) {
      return list.concat(x.patterns)
    }, [])

  return result.length > 0 ? result : undefined
}

const filterModuleRules = directives => rules => rules.concat(
  directives.filter(byName('rule'))
    .map(getProps)
    .map(composeRule)
)

const filterIstanbul = directives => rules => rules.concat(
  directives.filter(byName('istanbul-coverage'))
    .map(getProps)
    .map(createIstanbulCoverageLoader)
)

const composeNode = directives => {
  if (directives.some(byName('disable-node-shims'))) {
    return {
      Buffer: false
    }
  }
  else {
    return undefined
  }
}

const composeRule = rule => {
  const loaders = rule.loaders.map(getProps).map(composeLoader);

  // temporary workaround for extract-text .. it doesn't work if it's specified
  // in loaders[] and not loader
  if (rule.useSingleLoader) {
    return {
      test: rule.pattern,
      loader: loaders[0],
      include: rule.include,
      exclude: rule.exclude,
    }
  }

  return {
    test: rule.pattern,
    loaders: rule.happy ?
      [ 'happypack/loader?id=' + rule.happyId ] :
      rule.loaders.map(getProps).map(composeLoader)
    ,
    include: rule.include,
    exclude: rule.exclude,
  }
}

const composeLoader = loader => {
  // temporary workaround for extract-text
  if (typeof loader === 'string') {
    return loader;
  }
  else if (loader.options) {
    return `${loader.name}?${JSON.stringify(loader.options)}`
  }
  else {
    return loader.name;
  }
}

const createIstanbulCoverageLoader = directive => {
  return {
    test: directive.pattern,
    loader: directive.loader,
    exclude: directive.exclude,
    include: directive.include,
    enforce: 'post'
  }
}

const defineExternals = directives => {
  return directives.filter(byName('external-modules')).map(getProps).reduce(function(map, d) {
    return assign(map, d)
  }, {})
}

const useCustomPlugins = directives => plugins => plugins.concat(
  directives.filter(byName('use-custom-plugin')).map(getProps)
)

const configureDevServer = directives => {
  const config = last(directives.filter(byName('dev-server')).map(getProps))
  return config || undefined
}

const setMode = directives => {
  const modeDirective = last(directives.filter(byName('mode'))) === 'development'
  return modeDirective || 'none'
}