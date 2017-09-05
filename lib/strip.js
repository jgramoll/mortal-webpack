const InvalidConfig = require('./InvalidConfig')
const { stripWith } = require('./utils')

/**
 * Strip the generated configuration of undefined values or empty objects and
 * arrays. This is an optional step and is only needed in case webpack is not
 * playing well (e.g. resorting to its defaults) with properties being set to an
 * undefined value.
 *
 * @param  {Config|InvalidConfig} output
 *         The output of [[compose]].
 *
 * @return {Config|InvalidConfig}
 */
const strip = config => {
  if (config instanceof InvalidConfig) {
    return config;
  }

  const { array, object, ident, prop, } = stripWith

  return stripWith([
    [ prop('entry'), object ],
    [ prop('externals'), object ],

    [ prop('module.noParse'), array ],
    [ prop('module.loaders.@'), object ],
    [ prop('module.loaders'), array ],
    [ prop('module.postLoaders.@'), object ],
    [ prop('module.postLoaders'), array ],
    [ prop('module.preLoaders'), array ],
    [ prop('module'), object ],

    [ prop('output'), object ],
    [ prop('resolve.alias'), object ],
    [ prop('resolve'), object ],
    [ prop('resolveLoader.alias'), object ],
    [ prop('resolveLoader'), object ],

    [ prop('watchOptions'), object ],

    [ ident, object ]
  ])(config)
}

module.exports = strip
