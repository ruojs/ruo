const moder = require('moder')

module.exports = (dirname) => {
  let fnList
  try {
    fnList = moder(dirname, {lazy: false, naming: 'camel'})
  } catch (err) {
    fnList = {}
  }

  let context = {}
  for (let name in fnList) {
    const fn = fnList[name]
    if (typeof fn !== 'function') {
      throw new Error(`Invalid context ${name}`)
    }

    if (context[name]) {
      throw new Error(`Context ${name} already exist`)
    }

    context[name] = fn
  }

  return (req, res, next) => {
    Object.assign(req, context)
    next()
  }
}
