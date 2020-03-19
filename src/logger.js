const os = require('os')

const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')
const Logstash = require('winston-logstash').Logstash
const Sentry = require('winston-common-sentry')

const rc = require('./rc')

const HOSTNAME = os.hostname()

//
// logger
//

let logger = winston.createLogger({
  transports: []
})

// working with morgan
logger.accesslogStream = {
  write: (message) => {
    logger.info(message, {type: 'accesslog'})
  }
}

// lazy initialize logger transports
// https://github.com/winstonjs/winston/blob/master/docs/transports.md
logger.initialize = ({name, file, logstash, sentry, stdout} = {}) => {
  name = name || HOSTNAME
  const env = rc.env

  const consoleTransport = new (winston.transports.Console)(convertOptionsToWinstonV3({
    name: 'consoleTransport',
    prettyPrint: true,
    colorize: true
  }))

  if (env === 'development' || env === 'test' || stdout) {
    logger.add(consoleTransport, null, true)
  }

  if (file) {
    const filename = file.filename
    const fileTransport = new (DailyRotateFile)({
      name: 'fileTransport',
      colorize: false,
      timestamp: true,
      json: false,
      filename,
      maxsize: 1024 * 1024 * 100, // 100MB
      maxFiles: 1
      // datePattern: '.MM',
    })

    if (env === 'development' || env === 'production') {
      logger.add(fileTransport, null, true)
    }
  }

  if (logstash) {
    const logstashTransport = new (Logstash)({
      host: logstash.host,
      port: logstash.port,
      node_name: HOSTNAME,
      label: name,
      max_connect_retries: Infinity,
      timeout_connect_retries: 30 * 1000
    })
    logstashTransport.on('error', (err) => {
      console.error(err.stack); // eslint-disable-line
    })

    if (env === 'development' || env === 'production') {
      logger.add(logstashTransport, null, true)
    }
  }

  if (sentry) {
    const sentryTransport = new (Sentry)({
      level: 'warn',
      dsn: sentry.dsn
    })

    if (env === 'production') {
      logger.add(sentryTransport, null, true)
    }
  }
}

function convertOptionsToWinstonV3 (opts) {
  const newOpts = {}
  const formatArray = []
  const formatOptions = {
    stringify: () => winston.format((info) => { info.message = JSON.stringify(info.message) })(),
    formatter: () => winston.format((info) => { info.message = opts.formatter(Object.assign(info, opts)) })(),
    json: () => winston.format.json(),
    raw: () => winston.format.json(),
    label: () => winston.format.label(opts.label),
    logstash: () => winston.format.logstash(),
    prettyPrint: () => winston.format.prettyPrint({depth: opts.depth || 2}),
    colorize: () => winston.format.colorize({level: opts.colorize === true || opts.colorize === 'level', all: opts.colorize === 'all', message: opts.colorize === 'message'}),
    timestamp: () => winston.format.timestamp(),
    align: () => winston.format.align(),
    showLevel: () => winston.format((info) => { info.message = info.level + ': ' + info.message })()
  }
  Object.keys(opts).filter(k => !formatOptions.hasOwnProperty(k)).forEach((k) => { newOpts[k] = opts[k] })
  Object.keys(opts).filter(k => formatOptions.hasOwnProperty(k) && formatOptions[k]).forEach(k => formatArray.push(formatOptions[k]()))
  newOpts.format = winston.format.combine(...formatArray)
  return newOpts
}

module.exports = logger
