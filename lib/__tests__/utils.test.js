const { assert } = require('chai')
const utils = require('../utils')

describe('mortal-kombat::utils', function() {
  describe('curry', function() {
    const { curry } = utils

    it('works', function() {
      const f = (a, b, c) => a + b + c;

      assert.equal(f(1,1,1), 3)

      assert.equal(curry(f)(1, 1, 1), 3)
      assert.equal(curry(f)(1)(1, 1), 3)
      assert.equal(curry(f)(1, 1)(1), 3)
      assert.equal(curry(f)(1)(1)(1), 3)
    })
  })

  describe('stripWith', function() {
    const { stripWith: subject } = utils
    const { object, ident, prop, array, arrayOf } = subject

    it('can remove empty objects at any arbitrary depth', function() {
      const input = {
        a: 1,
        b: undefined,
        x: {
          y: {
            z: {}
          }
        },
      }

      const output = subject([
        [ prop('x.y.z'), object ],
        [ prop('x.y'), object ],
        [ prop('x'), object ],
        [ ident, object ]
      ])(input)

      assert.deepEqual(output, { a: 1 })

      assert.deepEqual(input, {
        a: 1,
        b: undefined,
        x: {
          y: {
            z: {}
          }
        }
      }, "it does not mutate objects")
    })

    it('removes empty arrays at any arbitrary depth', function() {
      const input = {
        a: 1,
        x: {
          y: {
            z: []
          }
        },
      }

      const output = subject([
        [ prop('x.y.z'), array ],
        [ prop('x.y'), object ],
        [ prop('x'), object ],
        [ ident, object ]
      ])(input)

      assert.deepEqual(output, { a: 1 })

      assert.deepEqual(input, {
        a: 1,
        x: {
          y: {
            z: []
          }
        }
      }, "it does not mutate objects")
    })

    it('works with arrays of objects...', function() {
      const input = {
        x: {
          y: [
            { },
            { a: undefined },
            { b: '1' }
          ]
        },
      }

      const output = subject([
        [ prop('x.y.@'), object ],
        [ prop('x.y'), array ],
        [ prop('x'), object ],
        [ ident, object ]
      ])(input)

      assert.deepEqual(output, {
        x: {
          y: [{ b: '1' }]
        }
      })

      assert.deepEqual(input, {
        x: {
          y: [
            { },
            { a: undefined },
            { b: '1' }
          ]
        }
      }, "it does not mutate objects")
    })
  })
})