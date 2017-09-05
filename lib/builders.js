const { patternToRegExp } = require('./utils')
const NullItem = {}
const notNullItem = x => x !== NullItem

module.exports = {
  use(profile) {
    return profile;
  },

  output(options) {
    return {
      name: 'output',
      params: options
    }
  },

  resolve({ directories, dynamicDirectories, extensions, fallbackDirectories, packageMains }) {
    return {
      name: 'resolve',
      params: {
        directories,
        dynamicDirectories,
        extensions,
        fallbackDirectories,
        packageMains,
      }
    }
  },

  resolveLoader({ directories, dynamicDirectories, extensions, fallbackDirectories, moduleTemplates, packageMains }) {
    return {
      name: 'resolve-loader',
      params: {
        directories,
        dynamicDirectories,
        extensions,
        fallbackDirectories,
        moduleTemplates,
        packageMains,
      }
    }
  },

  alias(aliasMap) {
    return { name: 'alias', params: aliasMap }
  },

  defineConstants(definitions) {
    return { name: 'runtime-constants', params: definitions }
  },

  sortBundleModules() {
    return { name: 'sort-bundle-modules' }
  },

  dontParse(patterns) {
    return { name: 'dont-parse', params: { patterns } }
  },

  compileHTML(options) {
    return {
      name: 'html-file',
      params: options
    }
  },

  generateBundle({ name, modules }) {
    return { name: 'bundle', params: { name, modules } }
  },

  generateCommonBundle({ name, modules }) {
    return { name: 'bundle', params: { name, modules, common: true } }
  },

  devTool(tool) {
    return { name: 'dev-tool', params: tool }
  },

  defineExternalModules(externalMap) {
    return { name: 'external-modules', params: externalMap }
  },

  compile(pattern, { enableHappyPack, loaders, include, exclude }) {
    return {
      name: 'rule',
      params: {
        happy: enableHappyPack,
        happyId: pattern.toString(),
        pattern: patternToRegExp(pattern),
        include: include,
        exclude: exclude,
        loaders: loaders.filter(notNullItem),
      }
    }
  },

  loader({ name, options, enabled = true }) {
    if (enabled === false) {
      return NullItem;
    }

    return { name: 'loader', params: { name, options } }
  },

  when(predicate, def) {
    if (typeof predicate === 'function' && predicate(process.env)) {
      return def[0]
    }
    else if (predicate === true) {
      return def[0]
    }
    else {
      return []
    }
  },

  env(name, def) {
    if (process.env.NODE_ENV === name) {
      return def[0];
    }
    else {
      return []
    }
  },

  enableDevServer({ host }) {
    return { name: 'dev-server', params: { host } }
  },

  optimizeJS(uglifyOptions) {
    return { name: 'optimize-js', params: uglifyOptions }
  },

  dontEmitOnError() {
    return { name: 'dont-emit-on-error' }
  },

  instrumentJS({ pattern = '.js', exclude, include, loader, }) {
    return [
      { name: 'runtime-constants', params: { 'process.env.COVERAGE': '1' } },
      { name: 'istanbul-coverage', params: {
        pattern: patternToRegExp(pattern),
        loader,
        include,
        exclude
      } }
    ]
  },

  useDLL({ path, context }) {
    return { name: 'dll', params: { path, context } }
  },

  defineDLL({ path, name }) {
    return { name: 'define-dll', params: { path, name } }
  },

  disableNodeShims() {
    return { name: 'disable-node-shims' }
  },

  watch({ options }) {
    return { name: 'watch', params: options }
  },

  invariant(predicate, message) {
    return { name: 'invariant', params: { predicate, message } }
  },

  ensureEnv(env) {
    return {
      name: 'invariant',
      params: {
        predicate: process.env.NODE_ENV === env,
        message: (
          `Target requires NODE_ENV to be set to "${env}" while it is set to ` +
          `"${process.env.NODE_ENV}". Please re-run by sourcing NODE_ENV=${env} `+
          `into the environment.`
        )
      }
    }
  }
}
