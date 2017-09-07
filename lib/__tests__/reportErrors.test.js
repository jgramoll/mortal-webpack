const { assert } = require('chai')
const sinon = require('sinon')
const path = require('path')
const { compose, reportErrors, InvalidConfig, b } = require('../')

describe('mortal-kombat::reportErrors', function() {
  const sandbox = sinon.createSandbox()

  beforeEach(function() {
    sandbox.stub(process, 'exit')
  })

  afterEach(function() {
    sandbox.restore()
  })

  it('works', function() {
    reportErrors({ exit: false, write: sandbox.stub(), }, new InvalidConfig([{
      message: 'Hello',
      location: new Error()
    }]))
  })

  it('is a no op if not passed an InvalidConfig', function() {
    const object = {}

    assert.equal(reportErrors({}, object), object)

    sandbox.assert.notCalled(process.exit)
  })

  it('exits the process', function() {
    reportErrors({ write: sandbox.stub() }, new InvalidConfig([]))

    sandbox.assert.calledWith(process.exit, 1)
  })

  it('reports the location', function(done) {
    reportErrors({
      exit: false,
      context: null,
      write: string => {
        assert.include(string, __filename)
        done()
      },
    }, compose({}, [
      b.invariant(false, 'foo')
    ]))
  })

  it('accepts a list of files to exclude from reporting as location', function(done) {
    reportErrors({
      exit: false,
      write: string => {
        assert.notInclude(string, path.basename(__filename))
        done()
      },
      traceFileBlacklist: [ __filename ]
    }, compose({}, [
      b.invariant(false, 'foo')
    ]))
  })

  it('omits context from the reported location', function(done) {
    reportErrors({
      exit: false,
      context: __dirname,
      write: string => {
        assert.match(string, new RegExp(`\n/${path.basename(__filename)}:\\d+`))
        done()
      },
    }, compose({}, [
      b.invariant(false, 'foo')
    ]))
  })
})