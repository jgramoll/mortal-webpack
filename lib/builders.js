const { canUseModule } = require('./utils')
const FileTypes = require('./FileTypes')
const NullItem = {}
const notNullItem = x => x !== NullItem

/**
 * @module builders
 *
 * @typedef {builders~FilePattern}
 * @alias FilePattern
 *
 * A string pointing to either a directory or to a specific file.
 *
 * @typedef {builders~FileExtension}
 * @alias FileExtension
 *
 * A string representing a file extension with the leading dot. An "empty" file
 * extension is required for webpack-1 in order to resolve files with a specific
 * extension.
 *
 * Example values:
 *
 *     ""
 *     ".js"
 *     ".css"
 *
 * @typedef {builders~Directive}
 * @alias Directive
 *
 * A directive is the internal representation of a configuration directive. You
 * do not create or interact with these constructs directly. Instead, you are
 * expected to generate them using the builder APIs and pass them to [[compose]]
 * to generate the resulting configuration.
 *
 * Directives are plain objects (POJOs).
 *
 * @property {String} name
 *           A unique name that describes this directive.
 *
 * @property {Any?} params
 *           Any parameters needed for applying this directive.
 */
const b = {
  /**
   * Use a set of directives. This can be utilized to create composite targets.
   *
   * @param  {Array.<Directive>} profile
   * @return {Array.<Directive>}
   *
   * @example
   *
   *     const baseTarget = [
   *       b.alias({ foo: 'bar' })
   *     ]
   *
   *     const developmentTarget = [
   *       b.use(baseTarget),
   *
   *       b.alias({ bar: 'baz' })
   *     ]
   */
  use(profile) {
    return profile;
  },

  /**
   * Configure [output](https://webpack.github.io/docs/configuration.html#output)
   * parameters.
   *
   * @param {Object} options
   * @param {String} options.filename
   * @param {String} options.path
   * @param {String} options.publicPath
   *        This parameter will be adjusted in case you've [[enabled the dev server | .enableDevServer]].
   *
   * @param {String} options.library
   *        This parameter will be overridden in case you're [[defining a DLL | .generateDLL]].
   *
   * @return {Directive}
   */
  output(options) {
    return {
      name: 'output',
      params: options
    }
  },

  /**
   * Configure [resolve](https://webpack.github.io/docs/configuration.html#resolve)
   * parameters for resolving modules.
   *
   * A few parameters were renamed to be more meaningful and are listed below,
   * otherwise the parameters are as they appear in webpack-1 documentation.
   *
   * To define resolving aliases, see [[.alias]].
   *
   * @param  {Array.<FilePattern>} options.directories
   *         Maps to [resolve.root](https://webpack.github.io/docs/configuration.html#resolve-root)
   *
   * @param  {Array.<FilePattern>} options.relativeDirectories
   *         Maps to [resolve.modulesDirectories](https://webpack.github.io/docs/configuration.html#resolve-modulesdirectories)
   *
   * @param  {Array.<FileExtension>} options.extensions
   *         Maps to [resolve.extensions](https://webpack.github.io/docs/configuration.html#resolve-extensions)
   *
   * @param  {Array.<FilePattern>} options.fallbackDirectories
   *         Maps to [resolve.fallback](https://webpack.github.io/docs/configuration.html#resolve-fallback)
   *         in webpack1.
   *
   * @return {Directive}
   */
  resolveModules({ directories, relativeDirectories, extensions, fallbackDirectories, packageMains }) {
    return {
      name: 'resolve',
      params: {
        directories,
        relativeDirectories,
        extensions,
        fallbackDirectories,
        packageMains,
      }
    }
  },

  /**
   * Configure [resolveLoader](https://webpack.github.io/docs/configuration.html#resolveloader)
   * parameters for resolving _loaders_.
   *
   * @param  {Array.<FilePattern>} options.directories
   *         Maps to [resolve.root](https://webpack.github.io/docs/configuration.html#resolve-root)
   *
   * @param  {Array.<FilePattern>} options.relativeDirectories
   *         Maps to [resolve.modulesDirectories](https://webpack.github.io/docs/configuration.html#resolve-modulesdirectories)
   *
   * @param  {Array.<FileExtension>} options.extensions
   *         Maps to [resolve.extensions](https://webpack.github.io/docs/configuration.html#resolve-extensions)
   *
   * @param  {Array.<FilePattern>} options.fallbackDirectories
   *         Maps to [resolve.fallback](https://webpack.github.io/docs/configuration.html#resolve-fallback)
   *         in webpack1.
   *
   * @param  {Array.<String>} options.moduleTemplates
   *         See [resolveLoader.moduleTemplates](https://webpack.github.io/docs/configuration.html#resolveloader-moduletemplates)
   *
   * @param  {Array.<String>} options.packageMains
   *         See [resolve.packageMains](https://webpack.github.io/docs/configuration.html#resolve-packagemains)
   *
   * @return {Directive}
   */
  resolveLoaders({ directories, relativeDirectories, extensions, fallbackDirectories, moduleTemplates, packageMains }) {
    return {
      name: 'resolve-loader',
      params: {
        directories,
        relativeDirectories,
        extensions,
        fallbackDirectories,
        moduleTemplates,
        packageMains,
      }
    }
  },

  /**
   * Define [aliases](https://webpack.github.io/docs/configuration.html#resolve-alias) for modules.
   *
   * @see webpack.resolve.alias
   *
   * @param  {Object.<String, String>} aliases
   *         Mapping of aliases. Keys must be the names of modules as they
   *         appear in `require` (or `import`) statements and may be suffixed by
   *         `$` to make the alias usable only when the path ends with the key.
   *
   *         The values are paths to the modules that should be used instead.
   *
   * @return {Directive}
   *
   * @example
   *
   *     b.alias({
   *       // turn require("foo") into require("bar")
   *       'foo': 'bar',
   *
   *       // turn:
   *       //      require("react/addons")
   *       //      require("react/addons/x")
   *       // into:
   *       //      require("react-addons-test-utils")
   *       //      require("react/addons/x")
   *       'react/addons$': 'react-addons-test-utils'
   *     })
   */
  alias(aliases) {
    return { name: 'alias', params: aliases }
  },

  /**
   * Like [[.alias]] but for loaders.
   *
   * @param  {Object} aliases
   *         See [[.alias]]
   *
   * @return {Directive}
   */
  aliasLoader(aliases) {
    return { name: 'alias-loader', params: aliases }
  },

  /**
   * Define runtime constants that can be used by modules in the bundle. A
   * popular example is exposing `process.env.NODE_ENV` to branch between
   * environments, barring opinions.
   *
   * @see webpack.DefinePlugin
   *
   * @param  {Object.<String, String>} definitions
   *         Mapping of definitions. Keys are the identifiers that will be
   *         exposed to modules and the values are the values to assign to those
   *         identifiers.
   *
   *         Note that mortal-webpack will call `JSON.stringify()` on those
   *         values so you don't need to.
   *
   * @return {Directive}
   *
   * @example
   *
   *     b.defineConstants({
   *       'process.env.NODE_ENV': process.env.NODE_ENV,
   *       '__TEST__': process.env.NODE_ENV === 'test'
   *     })
   *
   *     // in your module
   *     if (process.env.NODE_ENV === 'development') {
   *       // ...
   *     }
   *     else if (__TEST__) {
   *       // ...
   *     }
   */
  defineConstants(definitions) {
    return { name: 'runtime-constants', params: definitions }
  },

  /**
   * Use the [occurrence order](https://webpack.github.io/docs/list-of-plugins.html#occurrenceorderplugin)
   * plugin to sort the resulting modules in the bundle and make the output
   * consistent between different runs.
   *
   * @return {Directive}
   */
  sortBundleModules() {
    return { name: 'sort-bundle-modules' }
  },

  /**
   * Exclude files from being processed by any loader even if their rules match.
   *
   * This is useful for source files that are either already pre-processed (e.g.
   * "dist" files in npm modules) or for legacy files that make webpack go
   * crazy.
   *
   * An additional use I found for this directive is to gain some speed; really
   * large vendor files (Ember? ._.) tend to take a gross amount of time to
   * process, so if you can find a pre-processed version of those modules you
   * may spare yourself some boredom.
   *
   * @see webpack.module.noParse
   *
   * @param  {Array.<FilePattern>} patterns
   * @return {Directive}
   *
   * @example
   *
   * Don't parse any file under a directory named "vendor"; just use them as-is.
   *
   *     b.dontParse([ new RegExp('vendor/') ])
   */
  dontParse(patterns) {
    return { name: 'dont-parse', params: { patterns } }
  },

  /**
   * Generate an HTML file using [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)
   * if it is available.
   *
   * **The plugin is expected to be installed otherwise an invariant violation
   * error will be thrown at [[compose]] time!**
   *
   * @param  {Object} options
   *         Options to pass to the plugin. Refer to its documentation.
   *
   * @return {Directive}
   *
   * @example
   *
   *     // @file: webpack.config.js
   *     b.compileHTML({
   *       template: path.resolve(__dirname, 'src/index.html'),
   *       filename: path.resolve(__dirname, 'dist/index.html')
   *     })
   *
   *     // @file: src/index.html
   *     <body>
   *       <% if (process.env.NODE_ENV === 'test') { %>
   *         <script src="/dist/tests.js"></script>
   *       <% } else { %>
   *         <script src="/dist/app.js"></script>
   *       <% } %>
   *     </body>
   */
  compileHTML(options) {
    return [
      b.invariant(canUseModule('html-webpack-plugin'),
        `You are attempting to generate an HTML file but the ` +
        `"html-webpack-plugin" npm module does not seem to be installed. ` +
        `Ensure that module is installed and try again.`
      ),

      { name: 'html-file', params: options }
    ]
  },

  /**
   * Generate a bundle from a bunch of modules. This maps to webpack's
   * [entry points](https://webpack.github.io/docs/configuration.html#entry).
   *
   * @param  {String} options.name
   *         A name for the bundle which may be utilized in the output by the
   *         `[name]` interpolation pattern.
   *
   * @param  {Array.<String>} options.modules
   *         Paths to the modules that the bundle should contain.
   *
   * @return {Directive}
   *
   * @see .generateCommonBundle
   */
  generateBundle({ name, modules }) {
    return { name: 'bundle', params: { name, modules } }
  },

  /**
   * Generate a bundle like in [[.generateBundle]] except that this one is meant
   * to be the "common" bundle that includes modules referenced by one or more
   * other bundles.
   *
   * Commonly this is referred to as the "vendor" or "commons" bundle. Or chunk.
   * Whatever confuses you more.
   *
   * @see webpack.optimize.CommonsChunkPlugin
   *
   * @example
   *
   * Say you split your application modules into three bundles as such:
   *
   *     1. "guest"
   *     2. "member"
   *     3. "admin"
   *
   * However, they all use some common dependencies like "lodash", so you'd end
   * up defining "lodash" to be a member of a common bundle that will then be
   * available for all 3 bundles above:
   *
   *     c.generateCommonBundle({ name: 'vendor', modules: [ 'lodash' ] })
   *     c.generateBundle({ name: 'guest', modules: [ './src/guest.js' ] })
   *     c.generateBundle({ name: 'member', modules: [ './src/member.js' ] })
   *     c.generateBundle({ name: 'admin', modules: [ './src/admin.js' ] })
   *
   * > **Note**
   * >
   * > It makes sense to have only one common bundle in a build, and mortal-webpack
   * > currently performs no checks to ensure that to be the case, so act with
   * > responsibility please unless you know what you're doing!
   *
   * @param {String} options.name
   *        See [[.generateBundle]]
   *
   * @param {Array.<String>} options.modules
   *        See [[.generateBundle]]
   *
   * @param {Boolean} [options.strict=true]
   *        Only allow the modules referenced in the "modules" parameter to
   *        show up in the bundle. This is the default mortal-webpack behaviour
   *        but it is not the default webpack behaviour.
   *
   *        Internally, it does this by setting the `minChunks` plugin option to
   *        `Infinity`.
   *
   *        More information can be found in the [[common bundles guide | ../examples/common-bundles.md]].
   *
   * @param {Object} [options.pluginOptions={}]
   *        Override options on the [underlying plugin directly](https://webpack.github.io/docs/list-of-plugins.html#commonschunkplugin).
   *
   * @return {Directive}
   */
  generateCommonBundle({ name, modules, strict = true, pluginOptions }) {
    return { name: 'bundle', params: {
      name,
      modules,
      common: true,
      strict,
      pluginOptions
    } }
  },

  /**
   * Specify the ["dev tool"](https://webpack.github.io/docs/configuration.html#devtool)
   * to use in the resulting bundle.
   *
   * @param  {String} tool
   *         One of the valid dev-tools webpack understands.
   *
   * @return {Directive}
   */
  devTool(tool) {
    return { name: 'dev-tool', params: tool }
  },

  /**
   * Define a mapping of modules to be considered "external" and not be served
   * by webpack (at least not in this build.)
   *
   * Refer to the upstream [externals documentation](https://webpack.github.io/docs/configuration.html#externals)
   * for more information about this.
   *
   * @example
   *
   * Use jQuery from `window` instead of `npm` - do not include it in the build:
   *
   *     b.defineExternalModules({
   *       'jquery': 'jQuery'
   *     })
   *
   *     // in your source modules, the following two statements are
   *     // equivalent:
   *     const $ = require('jquery')
   *     const $ = window.jQuery
   *
   * @param  {Object.<String, Union.<Boolean, String, Array.<String>>>} externals
   * @return {Directive}
   */
  defineExternalModules(externals) {
    return { name: 'external-modules', params: externals }
  },

  /**
   * Compile files using a list of ["loaders"](https://webpack.github.io/docs/using-loaders.html).
   *
   * @param {Object} options
   *
   * @param {RegExp} options.pattern
   *        See [[FileTypes]] for pre-defined matchers you can utilize.
   *
   * @param {!Array.<Directive>} options.loaders
   *        List of "loader directives" generated by [[.loader]].
   *
   * @param {!Array.<FilePattern>} options.include
   *        List of patterns to apply the loaders to.
   *
   * @param {Array.<FilePattern>!} options.exclude
   *        List of patterns to exclude.
   *
   * @param {Boolean} [options.enableHappyPack=false]
   *        Enable this if you want to use [happypack](https://github.com/amireh/happypack)
   *        for parallel compilation.
   *
   * @param {Boolean} [options.useSingleLoader=false]
   *        Set this to true if you're using ExtractTextPlugin.extract().
   *
   *        Please note that HappyPack will not be honored if this option is
   *        enabled.
   *
   *        @since  1.1.1
   *
   * @return {Directive}
   */
  compile({ pattern, enableHappyPack, loaders, include, exclude, useSingleLoader = false }) {
    const enabledLoaders = loaders && loaders.filter(notNullItem) || [];

    return [
      b.invariant(typeof pattern === 'string' || pattern instanceof RegExp,
        `You must pass a pattern (a string or a RegExp) to "compile".`
      ),

      b.invariant(enabledLoaders.length > 0,
        `You must define at least one loader to compile.`
      ),

      b.invariant(!enableHappyPack || canUseModule('happypack'),
        `You requested HappyPack to be used for compiling but the ` +
        `"happypack" npm module does not seem to be installed. ` +
        `Ensure that module is installed and try again.`
      ),

      {
        name: 'rule',
        params: {
          happy: enableHappyPack && !useSingleLoader,
          happyId: pattern && pattern.toString(),
          pattern: pattern,
          include: include,
          exclude: exclude,
          loaders: enabledLoaders,
          useSingleLoader,
        }
      }
    ]
  },

  /**
   * Construct a "loader" directive for use by [[.compile]]. This helper is
   * preferred over defining loaders directly so that mortal-webpack can choose
   * the correct notation based on webpack's version and whether happypack is
   * in use or not.
   *
   * @param  {String}  options.name
   *         Name of the loader module, like `babel-loader` for example.
   *
   * @param  {Object}  options.options
   *         JSON-serializable set of loader options (or "query" as it's been
   *         called in webpack-1)
   *
   * @param  {Boolean} options.enabled
   *         Set this to false if you want to conditionally exclude this loader.
   *         This is a convenience option.
   *
   * @return {Directive}
   *         For use in the `loaders` parameter required by [[.compile]].
   */
  loader(params) {
    // temporary workaround for extract-text
    if (typeof params === 'string') {
      return { name: 'loader', params }
    }
    else {
      const { name, options, enabled = true } = params

      if (enabled === false) {
        return NullItem;
      }

      return { name: 'loader', params: { name, options } }
    }
  },

  /**
   * Apply directives if a predicate holds true.
   *
   * @param  {Union.<Boolean|function(): Boolean>} predicate
   * @param  {Array.<Directive>} directives
   *
   * @return {Array.<Directive>?}
   *
   * @see .whenEnv
   *
   * @example
   *
   *     b.when(process.env.USE_SOURCE_MAPS === '1', [
   *       b.devTool('source-map')
   *     ])
   */
  when(predicate, directives) {
    if (typeof predicate === 'function' && predicate()) {
      return directives
    }
    else if (predicate === true) {
      return directives
    }
    else {
      return []
    }
  },

  /**
   * Apply directives only in a specific "node" environment. This is equivalent
   * to calling [[.when]] with a predicate against `process.env.NODE_ENV`.
   *
   * @param  {String} env
   *         The desired value of `process.env.NODE_ENV`, like `"test"`.
   *
   * @param  {Array.<Directive>} directives
   * @return {Array.<Directive>?}
   *
   * @see .when
   *
   * @example
   *
   *     b.env('development', [
   *       b.devTool('eval'),
   *       b.enableDevServer({ ... })
   *     ])
   *
   *     b.env('production', [
   *       b.devTool('source-map')
   *     ])
   */
  whenEnv(env, directives) {
    return b.when(process.env.NODE_ENV === env, directives)
  },

  /**
   * Configure [webpack dev server](https://webpack.github.io/docs/webpack-dev-server.html).
   * This directive will take care of rewiring [output.publicPath](https://webpack.github.io/docs/configuration.html#output-publicpath)
   * so that it includes the dev server host that you specify.
   *
   * Note that this does **not** add the dev middleware or anything; it assumes
   * you're using the `webpack-dev-server` binary instead.
   *
   * @param {Object} params
   * @param {!String} params.host
   *        The host of the dev server, like `http://localhost:9090`.
   *
   * @return {Directive}
   */
  enableDevServer(params) {
    return { name: 'dev-server', params }
  },

  /**
   * Generate source maps for your bundles. If you're also [[optimizing |
   * .optimizeJS]] it will instruct UglifyJS to output source maps.
   *
   * @return {Directive}
   */
  generateSourceMaps() {
    return { name: 'source-maps' }
  },

  /**
   * Optimize the resulting bundles using [uglifyJs](https://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin).
   *
   * @param  {Object} uglifyOptions
   *         Options to pass to uglify. Refer to [their webpage](https://github.com/mishoo/UglifyJS2)
   *         for what these may be.
   *
   * @return {Directive}
   */
  optimizeJS(uglifyOptions = {}) {
    return { name: 'optimize-js', params: uglifyOptions }
  },

  /**
   * Instruct webpack not to generate any bundle if a module error occurs. This
   * is useful in production builds because you really don't want a broken
   * bundle. However, in development (assuming you're using `--watch`) it's okay
   * since you don't want to re-run webpack on every failure.
   *
   * @see webpack.NoEmitOnErrorsPlugin
   *
   * @return {Directive}
   */
  dontEmitOnError() {
    return { name: 'dont-emit-on-error' }
  },

  /**
   * Collect coverage information from JavaScript modules using
   * [istanbul](http://gotwarlost.github.io/istanbul/).
   *
   * The parameters are akin to those required by [[.compile]] since this ends
   * up generating a loader as well (or well, something like that anyway.)
   *
   * @param  {RegExp} options.pattern
   *         See [[FileTypes]] for pre-defined file matchers.
   *
   * @param {String} options.loader
   *        Path to the instrumenting loader. If you don't know what this is,
   *        see [[../examples/istanbul-instrumenting-loader.md]] for a sample
   *        implementation.
   *
   * @param {!Array.<FilePattern>} options.include
   *        List of file patterns to instrument.
   *
   * @param {Array.<FilePattern>!} options.exclude
   *        List of file patterns to exclude from instrumenting. Those would not
   *        count towards the coverage.
   *
   * @return {Array.<Directive>}
   *         The first directive will set the [[runtime constant | .defineConstants]]
   *         `process.env.COVERAGE` to `1` in case you need it. The second one
   *         will install the instrumenting loader.
   */
  instrumentJS({ pattern = FileTypes.JS, exclude, include, loader }) {
    return [
      b.defineConstants({ 'process.env.COVERAGE': '1' }),
      { name: 'istanbul-coverage', params: {
        pattern: pattern,
        loader,
        include,
        exclude
      } }
    ]
  },

  /**
   * Use a pre-built [DLL](http://webpack.github.io/docs/list-of-plugins.html#dllplugin).
   *
   * @param {String} options.path
   *        Path to the dll's _manifest_. This corresponds to the `path`
   *        parameter you passed when you've defined the DLL.
   *
   * @param {?String} options.context
   *        The directory from which the files defined in that manifest should
   *        be resolved from. This defaults to the context webpack was run in
   *        if you leave it out.
   *
   * @return {Directive}
   */
  useDLL({ path, context }) {
    return [
      b.invariant(canUseModule(path),
        `The DLL requested for use could not be found. This likely ` +
        `means you have forgotten to build that target.`
      ),

      { name: 'dll', params: { path, context } }
    ]
  },

  /**
   * Generate a bundle that can be used as a DLL.
   *
   * @param {String} options.path
   *        Path to where the DLL's "manifest" will be generated. This file
   *        is needed by webpack when it wants to reference this DLL.
   *
   *        It is safe not to track this file in source control.
   *
   * @param {String} options.name
   *        A name for the generated bundle. You can use this for interpolation
   *        in output and other places where `[name]` is interpolated.
   *
   * @param {Array.<String>} options.modules
   *        The modules to include in the bundle. This is similar to the
   *        parameter in [[.generateBundle]].
   *
   * @param {String} [options.libraryName]
   *        An "identifier" for the function exported by the bundle. This is for
   *        internal use by webpack and has to match the "output.libraryName",
   *        which mortal-webpack will do implicitly for you.
   *
   *        If you leave this blank, we will define it as:
   *
   *            dll_[name]_[hash]
   *
   *        See [the reference page](http://webpack.github.io/docs/list-of-plugins.html#dllplugin)
   *        for more information.
   *
   * @return {Directive}
   *
   * @example
   *
   *     c.generateDLL({
   *       path: path.resolve(__dirname, 'tmp/dll-manifests/vendor.json'),
   *       name: 'ApplicationVendorDLL',
   *       modules: [
   *         'lodash',
   *         'react'
   *       ]
   *     })
   */
  generateDLL({ path, name, libraryName = null, modules }) {
    return [
      b.generateBundle({ name, modules }),
      {
        name: 'define-dll',
        params: {
          path,
          name: libraryName || 'dll_[name]_[hash]'
        }
      }
    ]
  },

  /**
   * Set the "context" directory from which modules will be resolved (this also
   * applies to DLLs unless explicitly overridden.)
   *
   * When unset, webpack defaults to `process.cwd()` which is not always a good
   * idea.
   *
   * @param {String} directory
   *        Absolute path to a directory. Make sure you use `path.resolve()`
   *        or something similar!
   *
   * @return {Directive}
   *
   * @see webpack.context
   * @example
   *
   *     // hierarchy:
   *     //
   *     // | node_modules
   *     // | src
   *     // | --- | a.js
   *     // | --- | b.js
   *     // | webpack.config.js
   *     b.context(path.resolve(__dirname))
   *
   *     // hierarchy:
   *     //
   *     // | node_modules
   *     // | src
   *     // | --- | a.js
   *     // | --- | b.js
   *     // | webpack
   *     // | ------- | config.js
   *     b.context(path.resolve(__dirname, '..'))
   */
  context(directory) {
    return { name: 'context', params: directory }
  },

  /**
   * Disable webpack's shimming of "node" features like `__dirname` and `Buffer`.
   *
   * Currently this isn't configurable and only disables the `Buffer` shim.
   *
   * @return {Directive}
   */
  disableNodeShims() {
    return { name: 'disable-node-shims' }
  },

  /**
   * Configure webpack's watcher. This is useful to tune if you're coupling
   * webpack with, say, Karma for tests.
   *
   * This will set [`config.watch`](https://webpack.github.io/docs/configuration.html#watch)
   * to true and define the options on [`config.watchOptions`](http://webpack.github.io/docs/webpack-dev-middleware.html#watchoptions-aggregatetimeout)
   * for [webpack-dev-middleware](http://webpack.github.io/docs/webpack-dev-middleware.html).
   *
   * @param {Object} watchOptions
   * @param {Number} [watchOptions.aggregateTimeout=300]
   * @param {Boolean} [watchOptions.poll=true]
   *
   * @return {Directive}
   */
  watch(watchOptions) {
    return { name: 'watch', params: watchOptions }
  },

  /**
   * Break the build if a condition is not met. This is very useful to ensure
   * that build parameters (environment variables or javascript ones) are what
   * you expect them to be, like say `process.env.NODE_ENV`.
   *
   * If the invariant does not hold, [[compose]] will return an instance of
   * the [[InvalidConfig]] class instead of the configuration object.
   *
   * @param  {Boolean|function(): Boolean} predicate
   * @param  {String} message
   *         A message to present to the user in case the invariant does not hold.
   *
   * @return {Directive}
   *
   * @see .ensureEnv
   *
   * @example
   *
   * This shows how we can ensure that the `COVERAGE` environment variable is
   * either not set or if it is, the value is valid (which is the string "1"):
   *
   *     b.invariant(!process.env.COVERAGE || process.env.COVERAGE === '1',
   *       "COVERAGE environment variable must either be unset" +
   *       "or set to '1'."
   *     )
   *
   */
  invariant(predicate, message) {
    return { name: 'invariant', params: { predicate, message, location: new Error() } }
  },

  /**
   * Break the build if `process.env.NODE_ENV` is not set to the expected
   * value. This is a common issue where the code relies on that variable and
   * the user (or a script) forgets to set it.
   *
   * Internally, this ends up calling [[.invariant]] to perform the check so
   * the behaviour is similar to it.
   *
   * @param {String} env
   *        A NODE_ENV value, like "development", that you want to ensure.
   *
   * @return {Directive}
   *
   * @see .invariant
   *
   * @example
   *
   * ```javascript
   * b.ensureEnv('test')
   * ```
   *
   * ```shell
   * $ webpack
   * # ERROR Target requires NODE_ENV to be set to "test" ...
   *
   * $ NODE_ENV=test webpack
   * # OK
   * ```
   */
  ensureEnv(env) {
    return b.invariant(process.env.NODE_ENV === env, (
      `Target requires NODE_ENV to be set to "${env}" while it is set to ` +
      `"${process.env.NODE_ENV}". Please re-run after sourcing NODE_ENV=${env} `+
      `into the environment.`
    ))
  },

  /**
   * Print a message to standard out. Useful for informing the user of
   * conditional directives (for example, whether coverage is enabled.)
   *
   * @param  {String} message
   * @return {Directive}
   */
  message(message) {
    return { name: 'message', params: message }
  },

  /**
   * Add a custom plugin.
   *
   * @param  {Object} plugin
   *         The plugin to use, like `new ExtractTextWebpackPlugin(...)`.
   *
   * @return {Directive}
   */
  plugin(plugin) {
    return { name: 'use-custom-plugin', params: plugin }
  }
}

module.exports = b