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
})