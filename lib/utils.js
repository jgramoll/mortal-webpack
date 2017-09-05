exports.assign = (a, b) => Object.assign({}, a, b)
exports.patternToRegExp = x => typeof x === 'string' ? new RegExp(`${x}$`) : x
exports.last = x => x && x[x.length - 1] || undefined
exports.flow = seq => x => seq.reduce((composite, f) => f(composite), x)
exports.flatten = x => x.reduce(function(list, a) { return list.concat(a) }, [])
exports.curry = f => {
  const count = f.length;

  return (function apply(prevArgs) {
    const nextArguments = prevArgs.concat(Array.prototype.slice.call(arguments, 1))

    if (nextArguments.length >= count) {
      return f.apply(null, nextArguments)
    }
    else {
      return apply.bind(null, nextArguments)
    }
  }([]))
}