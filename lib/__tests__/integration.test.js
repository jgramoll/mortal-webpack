const { assert } = require('chai')
const R = require('ramda')
const sinon = require('sinon')
const path = require('path')
const { compose, InvalidConfig, FileTypes, b } = require('../')

describe('mortal-kombat', function() {
  const sandbox = sinon.createSandbox()
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
          assert.match(error.message, message)

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
    },

    hasLoggedMessage: message => () => {
      sandbox.assert.calledWith(console.log, message)
    }
  }

  const features = [
    {
      name: 'alias',
      input: [ b.alias({ foo: 'bar' }) ],
      specs: [
        assertions.hasProperty('resolve.alias', { foo: 'bar' })
      ]
    },
    {
      name: 'aliasLoader',
      input: [ b.aliasLoader({ foo: 'bar' }) ],
      specs: [
        assertions.hasProperty('resolveLoader.alias', { foo: 'bar' })
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
        assertions.hasProperty('module.rules.0', {
          test: FileTypes.JS,
          loaders: [ 'babel-loader' ],
          include: undefined,
          exclude: undefined,
        })
      ]
    },

    {
      name: 'compile: requires a pattern',
      input: [
        b.compile({ loaders: [ b.loader({ name: 'babel-loader' }) ]})
      ],

      specs: [
        assertions.hasError(/You must pass a pattern/)
      ]
    },

    {
      name: 'compile: requires a loader',
      input: [
        b.compile({
          pattern: FileTypes.JS
        })
      ],

      specs: [
        assertions.hasError(/You must define at least one loader/)
      ]
    },

    {
      name: 'compile: with HappyPack',
      input: [
        b.compile({
          enableHappyPack: true,
          pattern: FileTypes.JS,
          loaders: [ b.loader({ name: 'babel-loader' }) ]
        })
      ],

      specs: [
        assertions.hasNoErrors(),
        assertions.hasPlugin('HappyPlugin')
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
        assertions.hasPlugin('NoEmitOnErrorsPlugin'),
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
        assertions.hasProperty('optimization.splitChunks', {
          name: 'app'
        }),
      ]
    },

    {
      name: 'generateSourceMaps',
      input: [
        b.generateSourceMaps(),
        b.optimizeJS(),
      ],

      specs: [
        assertions.hasProperty('devtool', 'source-map'),
        assertions.hasProperty('optimization.minimize', true)
      ]
    },

    {
      name: 'instrumentJS',
      input: () => [
        b.instrumentJS({
          loader: 'istanbul-loader'
        })
      ],

      specs: [
        assertions.hasProperty('module.rules.0', {
          test: FileTypes.JS,
          loader: 'istanbul-loader',
          include: undefined,
          exclude: undefined,
          enforce: 'post'
        }),
      ]
    },

    {
      name: 'invariant: as function',
      input: () => [
        b.invariant(() => false, 'test')
      ],

      specs: [
        assertions.hasError(/test/),
      ]
    },

    {
      name: 'invariant (not held)',
      input: () => [
        b.invariant(false, 'test')
      ],

      specs: [
        assertions.hasError(/test/),
      ]
    },

    {
      name: 'invariant (held)',
      input: () => [
        b.invariant(true, 'test')
      ],

      specs: [
        assertions.hasNoErrors(),
      ]
    },

    {
      name: 'loader',
      input: () => [
        b.compile({
          pattern: FileTypes.JS,
          loaders: [
            b.loader({
              name: 'babel-loader',
              options: { presets: [ 'es2015' ] }
            })
          ]
        })
      ],

      specs: [
        assertions.hasNoErrors(),
        assertions.hasProperty('module.rules.0.loaders.0', `babel-loader?${JSON.stringify({presets: ["es2015"]})}`),
      ]
    },

    {
      name: 'loader: enabled = false',
      input: () => [
        b.compile({
          pattern: FileTypes.JS,
          loaders: [
            b.loader({ name: 'react-i18nliner/webpack-loader', enabled: false }),
            b.loader({ name: 'babel-loader' })
          ]
        })
      ],

      specs: [
        assertions.hasNoErrors(),
        assertions.hasProperty('module.rules.0.loaders.length', 1),
        assertions.hasProperty('module.rules.0.loaders', [ 'babel-loader' ]),
      ]
    },

    {
      name: 'message',
      input: () => [
        b.message('hai')
      ],

      specs: [
        assertions.hasNoErrors(),
        assertions.hasLoggedMessage('hai'),
      ]
    },

    {
      name: 'optimizeJS',
      input: () => [
        b.optimizeJS()
      ],

      specs: [
        assertions.hasNoErrors(),
        assertions.hasProperty('optimization.minimize', true)
      ]
    },
    {
      name: 'output',
      input: [ b.output({ path: '/tmp' }) ],
      specs: [
        assertions.hasProperty('output.path', '/tmp')
      ]
    },

    {
      name: 'resolveLoaders',
      input: [
        b.resolveLoaders({
          extensions: [ '', '.js' ]
        })
      ],
      specs: [
        assertions.hasProperty('resolveLoader.extensions', [ '', '.js' ])
      ]
    },

    {
      name: 'resolveModules',
      input: [
        b.resolveModules({
          extensions: [ '', '.js' ]
        })
      ],
      specs: [
        assertions.hasProperty('resolve.extensions', [ '', '.js' ])
      ]
    },

    {
      name: 'sortBundleModules',
      input: [
        b.sortBundleModules()
      ],
      specs: [
        assertions.hasPlugin('OccurrenceOrderPlugin')
      ]
    },

    {
      name: 'use',
      input: [
        b.use([
          b.devTool('eval')
        ])
      ],
      specs: [
        assertions.hasProperty('devtool', 'eval')
      ]
    },

    {
      name: 'use: with nested arrays',
      input: [
        b.use([
          b.when(true, [
            b.devTool('eval')
          ])
        ])
      ],
      specs: [
        assertions.hasProperty('devtool', 'eval')
      ]
    },

    {
      name: 'useDLL',
      input: [
        b.useDLL({
          path: path.resolve(__dirname, 'fixtures/dll-manifest.json')
        })
      ],
      specs: [
        assertions.hasNoErrors(),
        assertions.hasPlugin('DllReferencePlugin'),
        assertions.hasPluginWithOptions('DllReferencePlugin', {
          key: 'options',
          options: {
            manifest: require('./fixtures/dll-manifest.json')
          }
        })
      ]
    },

    {
      name: 'useDLL: verifies manifest is readable',
      input: [
        b.useDLL({
        })
      ],
      specs: [
        assertions.hasError(/The DLL requested for use could not be found./),
      ]
    },

    {
      name: 'watch',
      input: [
        b.watch(),
      ],
      specs: [
        assertions.hasProperty('watch', true),
      ]
    },

    {
      name: 'watch: with options',
      input: [
        b.watch({
          aggregateTimeout: 5000,
          poll: false,
        }),
      ],
      specs: [
        assertions.hasProperty('watchOptions.aggregateTimeout', 5000),
        assertions.hasProperty('watchOptions.poll', false),
      ]
    },

    {
      name: 'when',
      input: () => [
        b.when(true, [
          b.devTool('eval')
        ]),

        b.when(false, [
          b.devTool('source-map')
        ])
      ],

      specs: [
        assertions.hasProperty('devtool', 'eval')
      ]
    },

    {
      name: 'when: with function predicate',
      input: () => [
        b.when(() => true, [
          b.devTool('eval')
        ]),

        b.when(() => false, [
          b.devTool('source-map')
        ])
      ],

      specs: [
        assertions.hasProperty('devtool', 'eval')
      ]
    },

    {
      name: 'unless',
      input: () => [
        b.unless(false, [
          b.devTool('eval')
        ]),

        b.unless(true, [
          b.devTool('source-map')
        ])
      ],

      specs: [
        assertions.hasProperty('devtool', 'eval')
      ]
    },

    {
      name: 'unless: with function predicate',
      input: () => [
        b.unless(() => false, [
          b.devTool('eval')
        ]),

        b.unless(() => true, [
          b.devTool('source-map')
        ])
      ],

      specs: [
        assertions.hasProperty('devtool', 'eval')
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

  ]

  afterEach(function() {
    sandbox.restore()
  })

  features.forEach(({ name, focus, input, specs, env }) => {
    const test = focus ? it.only : it;

    test(name, function() {
      const originalEnv = process.env.NODE_ENV;

      if (env) {
        process.env.NODE_ENV = env;
      }

      sandbox.stub(console, 'log')

      const config = compose({}, mebbeEval(input))

      if (env) {
        process.env.NODE_ENV = originalEnv
      }

      specs.forEach(f => f(config))

      sandbox.restore()
    })
  })
})