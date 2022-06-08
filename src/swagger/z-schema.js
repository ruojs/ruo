const isNumber = require('lodash.isnumber')
const Ajv = require('ajv')

const validators = {}

function returnTrue () {
  return true
}

validators.int32 = validators.int64 = function (val) {
  return isNumber(val)
}

validators.byte = returnTrue
validators.double = returnTrue
validators.float = returnTrue
validators.password = returnTrue

module.exports = (options) => {
  const ajv = new Ajv(options)

  // Add the custom format validator
  Object.keys(validators).forEach(function (name) {
    ajv.addFormat(name, validators[name])
  })
  return ajv
}
