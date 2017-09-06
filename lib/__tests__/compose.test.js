const { assert } = require('chai')
const R = require('ramda')
const { compose, strip, InvalidConfig, FileTypes, builders: b } = require('../')

describe('mortal-kombat::compose', function() {
  it('works with no directives', function() {
    const config = compose({}, [])

    assert.ok(config)
  })
})

describe('mortal-kombat::builders', function() {
  const mebbeEval = x => typeof x === 'function' ? x() : x
  const assertions = {
    hasProperty: (key, value) => config => {
      assert.deepEqual(R.view(R.lensPath(key.split('.')), config), value)
    },

    hasPlugin: name => config => {
      assert.include(config.plugins.map(x => x.constructor.name), name)
    },

    hasPluginWithOptions: (name, { key, options }) => config => {
      const [ plugin ] = config.plugins.filter(x => x.constructor.name === name)

      assert.ok(plugin)

      if (key) {
        assert(Object.keys(plugin).indexOf(key) > -1,
          `Plugin "${name}" does not have an attribute "${key}":\n- ${Object.keys(plugin).join('\n- ')}`
        )
      }

      const pool = key ? plugin[key] : plugin

      assert.include(pool, options)
    },

    hasError: message => output => {
      assert.ok(output instanceof InvalidConfig)

      const found = output.errors.some(error => {
        try {
          assert.match(error, message)

          return true;
        }
        catch (e) {
          return false;
        }
      })

      assert(found, `Expected an error to be raised with text matching: ${message}`)
    },

    hasNoErrors: () => output => {
      assert.notOk(output instanceof InvalidConfig)
    }
  }

  const features = [
    {
      name: 'output',
      input: [ b.output({ path: '/tmp' }) ],
      specs: [
        assertions.hasProperty('output.path', '/tmp')
      ]
    },

    {
      name: 'alias',
      input: [ b.alias({ foo: 'bar' }) ],
      specs: [
        assertions.hasProperty('resolve.alias', { foo: 'bar' })
      ]
    },

    {
      name: 'compile',
      input: [
        b.compile({
          pattern: FileTypes.JS,
          loaders: [
            b.loader({
              name: 'babel-loader'
            })
          ],
        })
      ],

      specs: [
        assertions.hasProperty('module.loaders.0', {
          test: FileTypes.JS,
          loaders: [ 'babel-loader' ]
        })
      ]
    },

    {
      name: 'compileHTML',
      input: [
        b.compileHTML({
          template: 'src/index.html',
          filename: 'out/index.html'
        })
      ],

      specs: [
        config => {
          const [ plugin ] = config.plugins.filter(x => x.constructor.name === 'HtmlWebpackPlugin')

          assert.ok(plugin)
          assert.include(plugin.options, {
            template: 'src/index.html',
            filename: 'out/index.html',
          })
        }
      ]
    },

    {
      name: 'context',
      input: [
        b.context('/tmp')
      ],

      specs: [
        assertions.hasProperty('context', '/tmp')
      ]
    },

    {
      name: 'defineConstants',
      input: [
        b.defineConstants({ foo: 'bar' })
      ],

      specs: [
        config => {
          const [ plugin ] = config.plugins.filter(x => x.constructor.name === 'DefinePlugin')

          assert.ok(plugin)
          assert.deepEqual(plugin.definitions, { foo: JSON.stringify('bar') })
        }
      ]
    },

    {
      name: 'generateDLL',
      input: [
        b.generateDLL({
          name: 'vendor',
          path: '/tmp/vendor-manifest.json',
          modules: [ 'a.js' ],
        })
      ],

      specs: [
        config => {
          const [ plugin ] = config.plugins.filter(x => x.constructor.name === 'DllPlugin')

          assert.ok(plugin)
          assert.equal(plugin.options.name, 'dll_[name]_[hash]', 'it sets a default name')
          assert.equal(plugin.options.path, '/tmp/vendor-manifest.json')
        },

        // it implicitly sets output.library to libraryName
        assertions.hasProperty('output.library', 'dll_[name]_[hash]'),

        // it defines an entry
        assertions.hasProperty('entry.vendor', [ 'a.js' ]),
      ]
    },

    {
      name: 'defineExternalModules',
      input: [
        b.defineExternalModules({
          foo: true
        })
      ],

      specs: [
        assertions.hasProperty('externals', { foo: true }),
      ]
    },

    {
      name: 'devTool',
      input: [
        b.devTool('eval')
      ],

      specs: [
        assertions.hasProperty('devtool', 'eval'),
      ]
    },

    {
      name: 'disableNodeShims',
      input: [
        b.disableNodeShims()
      ],

      specs: [
        assertions.hasProperty('node', { Buffer: false }),
      ]
    },

    {
      name: 'dontEmitOnError',
      input: [
        b.dontEmitOnError()
      ],

      specs: [
        assertions.hasPlugin('NoErrorsPlugin'),
      ]
    },

    {
      name: 'dontParse',
      input: [
        b.dontParse([ 'foo' ])
      ],

      specs: [
        assertions.hasProperty('module.noParse', [ 'foo' ]),
      ]
    },

    {
      name: 'enableDevServer',
      input: [
        b.enableDevServer({ host: 'http://localhost:9090' })
      ],

      specs: [
        assertions.hasProperty('output.publicPath', 'http://localhost:9090/'),
      ]
    },

    {
      name: 'enableDevServer (with custom publicPath)',
      input: [
        b.output({ publicPath: '/foo' }),
        b.enableDevServer({ host: 'http://localhost:9090' })
      ],

      specs: [
        assertions.hasProperty('output.publicPath', 'http://localhost:9090/foo'),
      ]
    },

    {
      name: 'ensureEnv',
      input: [
        b.ensureEnv('test', [])
      ],

      specs: [
        assertions.hasError(/Target requires NODE_ENV to be set to "test"/),
      ]
    },
    {
      name: 'ensureEnv (with matching env)',
      env: 'test',
      input: () => [
        b.ensureEnv('test', [])
      ],

      specs: [
        assertions.hasNoErrors(),
      ]
    },

    {
      name: 'whenEnv',
      env: 'development',
      input: () => [
        b.whenEnv('development', [
          b.devTool('eval')
        ]),

        b.whenEnv('production', [
          b.devTool('source-map')
        ])
      ],

      specs: [
        assertions.hasProperty('devtool', 'eval')
      ]
    },

    {
      name: 'generateBundle',
      input: () => [
        b.generateBundle({
          name: 'app',
          modules: [ 'a', 'b' ]
        })
      ],

      specs: [
        assertions.hasProperty('entry.app', [ 'a', 'b' ])
      ]
    },

    {
      name: 'generateCommonBundle',
      input: () => [
        b.generateCommonBundle({
          name: 'app',
          modules: [ 'a', 'b' ]
        })
      ],

      specs: [
        assertions.hasProperty('entry.app', [ 'a', 'b' ]),
        assertions.hasPluginWithOptions('CommonsChunkPlugin', {
          options: {
            chunkNames: 'app'
          }
        })
      ]
    },
    {
      name: 'instrumentJS',
      // focus: true,
      input: () => [
        b.instrumentJS({
          loader: 'istanbul-loader'
        })
      ],

      specs: [
        assertions.hasProperty('module.postLoaders.0', {
          test: FileTypes.JS,
          loader: 'istanbul-loader'
        }),
      ]
    },
  ]

  features.forEach(({ name, focus, input, specs, env }) => {
    const test = focus ? it.only : it;

    test(name, function() {
      const originalEnv = process.env.NODE_ENV;

      if (env) {
        process.env.NODE_ENV = env;
      }

      const config = strip(compose({}, mebbeEval(input)))

      if (env) {
        process.env.NODE_ENV = originalEnv
      }

      specs.forEach(f => f(config))
    })
  })
})