const R = require('ramda')

exports.assign = (a, b) => Object.assign({}, a, b)
exports.curry = R.curry
exports.flatten = R.flatten
exports.flow = f => R.pipe.apply(null, f)
exports.last = R.last
exports.canUseModule = name => {
  try {
    require(name)
    return true
  }
  catch (e) {
    return false
  }
}