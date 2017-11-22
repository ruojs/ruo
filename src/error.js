const statuses = require('statuses')

const names = {}
const messages = {}
const table = {}

/**
 * Generate code to error and name to error mapping.
 *
 * Error have three fields
 *   * name
 *   * message
 *   * status
 */
statuses.codes.forEach((code) => {
  const prefix = String(code).charAt(0)
  if (prefix === '4' || prefix === '5') {
    const name = toIdentifier(statuses[code])
    names[code] = name
    messages[code] = statuses[code]
    table[name] = {
      name,
      message: statuses[code],
      status: code
    }
  }
})

// generate error classes

/**
 * Convert a string of words to a JavaScript identifier.
 * @private
 */
function toIdentifier (str) {
  return str.split(' ').map(function (token) {
    return token.slice(0, 1).toUpperCase() + token.slice(1)
  }).join('').replace(/[^ _0-9a-z]/gi, '')
}

class HttpError extends Error {
  constructor (name, message) {
    super(message)

    this.name = name
    // backward compability
    this.type = name
  }
}

class ParameterError extends HttpError {
  constructor (field, expected, actual) {
    let message = `${field} should be ${expected}, got ${actual}`
    super('BadRequest', message)

    this.field = field
  }
}

module.exports = {
  HttpError,
  ParameterError,
  names,
  messages,
  table
}
