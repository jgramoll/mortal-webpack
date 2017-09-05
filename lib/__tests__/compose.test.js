const { assert } = require('chai')
const { get } = require('lodash')
const { compose, FileTypes, builders: b } = require('../')

describe('mortal-kombat::compose', function() {
  it('works with no directives', function() {
    const config = compose({}, [])

    assert.ok(config)
  })
})

describe('mortal-kombat::builders', function() {
  const assertions = {
    hasProperty: (key, value) => config => {
      assert.deepEqual(get(config, key), value)
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
        assertions.hasProperty('module.loaders[0]', {
          exclude: undefined,
          include: undefined,
          test: FileTypes.JS,
          loaders: [ 'babel-loader?{}' ]
        })
      ]
    },
  ]

  features.forEach(({ name, input, specs }) => {
    it(name, function() {
      const config = compose({}, input)

      specs.forEach(f => f(config))
    })
  })
})