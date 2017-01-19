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

let logger = new (winston.Logger)({
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
logger.initialize = ({name, file, logstash, sentry}) => {
  name = name || HOSTNAME
  const env = rc.env

  const consoleTransport = new (winston.transports.Console)({
    name: 'consoleTransport',
    prettyPrint: true,
    colorize: true
  })
  if (env === 'development' || env === 'test') {
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

module.exports = logger
