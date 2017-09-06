const R = require('ramda')

const assign = (a, b) => Object.assign({}, a, b)

const self = {}

const stripWith = strippers => original => strippers.reduce((stripped, [ read, write ]) => {
  if (read === self) {
    return write(stripped)
  }

  const path = read.split('.');

  if (path.some(fragment => fragment === '@')) {
    const arrayPath = R.last(path) === '@' ?
      path.slice(0, -1) :
      read.split('.@.')[0].split('.')
    ;
    const arrayLens = R.lensPath(arrayPath)
    const arrayValue = R.view(arrayLens, stripped)
    const nextArrayValue = arrayValue.map(write)
    const withModdedArray = R.set(arrayLens, nextArrayValue, stripped)

    return withModdedArray
  }
  else {
    const lens = R.lensPath(path)
    const value = R.view(lens, stripped)
    const nextValue = write(value)
    const nextObject = R.set(lens, nextValue, stripped)

    return nextObject
  }
}, original)

stripWith.object = x => {
  if (!x || typeof x !== 'object') {
    return x;
  }
  else {
    const withoutNulls = Object.keys(x).reduce(function(map, key) {
      if (x[key] === undefined) {
        return map
      }
      else {
        return Object.assign(map, { [key]: x[key] });
      }
    }, {})

    if (Object.keys(withoutNulls).length === 0) {
      return undefined;
    }
    else {
      return withoutNulls
    }
  }
}

stripWith.array = x => {
  if (!Array.isArray(x)) {
    return x;
  }
  else {
    const withoutNulls = x.filter(y => y !== undefined)

    if (withoutNulls.length === 0) {
      return undefined;
    }
    else {
      return withoutNulls;
    }
  }
}

stripWith.prop = R.identity
stripWith.ident = self

exports.assign = assign
exports.curry = R.curry
exports.flatten = x => x.reduce(function(list, a) { return list.concat(a) }, [])
exports.flow = f => R.pipe.apply(null, f)
exports.patternToRegExp = x => typeof x === 'string' ?
  new RegExp(`${x.replace(/\./g, '\\.')}$`) :
  x
exports.last = R.last
exports.stripWith = stripWith
exports.canUseModule = name => {
  try {
    require(name)
    return true
  }
  catch (e) {
    return false
  }
}