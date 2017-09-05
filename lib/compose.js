const webpack = require('webpack')
const HappyPack = require('happypack');
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
 * @param {Object} options
 * @param {Object?} options.happyPackOptions
 * @param {Array.<Directive>} directives
 *
 * @return {Config|InvalidConfig}
 *         The configuration object that can be passed to webpack.
 *
 *         In the case of an error, an instance of [[InvalidConfig]] will be
 *         returned which you can utilize to let the user know what went wrong.
 */
const compose = ({ happyPackOptions }, directives) => {
  const failures = checkInvariants(directives)

  if (failures.length) {
    return new InvalidConfig(failures);
  }

  return {
    devtool: setDevTool(directives),
    context: setContext(directives),
    entry: composeEntries(directives),
    externals: defineExternals(directives),
    module: composeModule(directives),
    node: composeNode(directives),
    output: composeOutput(directives),
    plugins: flow([
      defineDLLs(directives),
      defineRuntimeConstants(directives),
      generateHTMLFiles(directives),
      installCommonsChunkPlugin(directives),
      installHappyPacks(happyPackOptions, directives),
      installSortingPlugin(directives),
      installUglify(directives),
      maybeBreakOnError(directives),
      useDLLs(directives)
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
  const red = string => `\x1b[31m${string}\x1b[0m`

  return directives.filter(byName('invariant')).map(getProps).reduce((errors, { predicate, message }) => {
    // TODO: we may want to expose a separate API to compose like "check" that
    // returns a list of errors instead of deciding to terminate the process
    // ourselves
    if (!predicate) {
      return errors.concat([ `${red('ERROR')} ${message}` ])
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
    return directives.filter(byName('dev-server')).map(getProps).reduce(function(map, d) {
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
    root: resolveDirective.directories,
    fallback: resolveDirective.fallbackDirectories,
    modulesDirectories: resolveDirective.dynamicDirectories,
    packageMains: resolveDirective.packageMains,
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
    root: directive.directories,
    extensions: directive.extensions,
    fallback: directive.fallbackDirectories,
    modulesDirectories: directive.dynamicDirectories,
    packageMains: directive.packageMains,
    moduleTemplates: directive.moduleTemplates,
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
  return directives
    .filter(byName('bundle'))
    .map(getProps)
    .reduce(function(map, d) {
      return assign(map, { [d.name]: d.modules })
    }, {})
  ;
}

const composeWatch = directives => {
  return directives.some(byName('watch')) || undefined
}

const composeWatchOptions = directives => {
  return directives.filter(byName('watch')).map(getProps).reduce((map, d) => {
    return assign(map, d)
  }, {})
}

const installCommonsChunkPlugin = directives => plugins => {
  return plugins.concat(
    directives
      .filter(byName('bundle'))
      .map(getProps)
      .filter(x => x.common)
      .map(bundle => {
        return new webpack.optimize.CommonsChunkPlugin({
          name: bundle.name,
          filename: `${bundle.name}.js`,

          // do not change this: tell webpack not to move any module into the vendor
          // chunk other than the ones listed in the entry (which are defined insee
          // webpack/entries.js::vendor).
          //
          // otherwise, a11y-app will :poop: all over the place with its modules and
          // then bridge proper will have to learn a11y-app's modules and no one
          // wants that.
          minChunks: Infinity,
        })
      })
  )
}

const generateHTMLFiles = directives => plugins => {
  const HtmlWebpackPlugin = require('html-webpack-plugin')

  return plugins.concat(
    directives.filter(byName('html-file')).map(getProps).map(options => {
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
        manifest: require(d.path), // TODO: load error message
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

const installUglify = directives => plugins => {
  const options = last(directives.filter(byName('optimize-js')).map(getProps))

  if (options) {
    const withSourceMaps = directives.some(byName('source-maps')) ?
      assign(options, { sourceMap: true }) :
      options
    ;

    return plugins.concat(new webpack.optimize.UglifyJsPlugin(withSourceMaps))
  }
  else {
    return plugins;
  }
}

const maybeBreakOnError = directives => plugins => {
  if (directives.some(byName('dont-emit-on-error'))) {
    return plugins.concat(new webpack.NoErrorsPlugin())
  }
  else {
    return plugins;
  }
}

const composeModule = directives => {
  return {
    noParse: directives.filter(byName('dont-parse')).map(getProps).reduce(function(list, x) {
      return list.concat(x.patterns)
    }, []),
    loaders: directives.filter(byName('rule')).map(getProps).map(composeRule),
    postLoaders: directives.filter(byName('istanbul-coverage')).map(getProps).map(createIstanbulCoverageLoader)
  }
}

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
  if (loader.options) {
    return `${loader.name}?${JSON.stringify(loader.options || {})}`
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
    include: directive.include
  }
}

const defineExternals = directives => {
  return directives.filter(byName('external-modules')).map(getProps).reduce(function(map, d) {
    return assign(map, d)
  }, {})
}