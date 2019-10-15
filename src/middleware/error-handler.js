const rc = require('../rc')

const _ = require('lodash')
const debug = require('debug')(rc.name)
const {names, messages, table} = require('../error')

/**
 * NOTE: `next` parameter can't be removed because expressjs identify error handler by arguments.length.
 */
module.exports = (api, customErrorHandler = defaultErrorHandler) => {
  // application error can override framework predefined error
  // mainly used to define extra field in error object
  const globalErrorCodeTable = _.merge({}, table, api['x-errors'])

  return (err, req, res, next) => { // eslint-disable-line
    if (rc.env === 'development') {
      console.error('ErrorHandler', req.method, req.path, err.stack || err)
    } else {
      debug('ErrorHandler', err.stack || err)
    }

    if (typeof err === 'string') {
      err = {message: err}
    }

    if (!err.name) {
      err.name = names[500]
    }

    let data = getErrorData(err, req, globalErrorCodeTable)
    if (!data) {
      data = {name: names[500]}
    }

    data.message = err.message || data.message || messages[500]
    data.status = err.status || data.status || 500
    data.field = err.field
    data.error = err
    customErrorHandler(data, req, res)
  }
}

function defaultErrorHandler (err, req, res) {
  res.status(err.status).send(err)
}

function getErrorData (err, req, globalErrorCodeTable) {
  let data
  let name
  const isProcessing = _.get(req, ['state', 'processing'], false)
  const localErrorCodeTable = _.get(req, ['swagger', 'operation', 'x-errors'], {})

  // only use local error inside handler
  if (isProcessing && localErrorCodeTable[err.name]) {
    // generate local error name
    const path = req.route.path.endsWith('/') ? req.route.path.slice(0, -1) : req.route.path
    name = `${path}.${req.method.toLowerCase()}.${err.name}`
    data = localErrorCodeTable[err.name]
  } else {
    name = err.name
    data = globalErrorCodeTable[err.name]
  }

  if (!data) {
    return null
  }

  return _.assign({name}, data)
}
