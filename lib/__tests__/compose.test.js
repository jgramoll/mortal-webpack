const { assert } = require('chai')
const { compose } = require('../')

describe('mortal-kombat::compose', function() {
  it('works with no directives', function() {
    const config = compose({}, [])

    assert.ok(config)
  })
})