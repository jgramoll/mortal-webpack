exports.assign = (a, b) => Object.assign({}, a, b)
exports.patternToRegExp = x => typeof x === 'string' ? new RegExp(`${x}$`) : x
exports.last = x => x && x[x.length - 1] || undefined
exports.flow = seq => x => seq.reduce((composite, f) => f(composite), x)