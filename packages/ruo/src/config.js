const fs = require('fs')
const path = require('path')

const _ = require('lodash')
const debug = require('debug')('ruo')

const config = _.merge({
  name: 'ruo',
  source: 'src',
  exec: 'node',
  shadow: false,
  specPath: '/',
  docPath: '/doc',
  target: undefined,
  watch: [],
  test: {
    bootload: ''
  },
  cover: {
    bootload: ''
  },
  lint: {
    include: [
      'src/**/*.js'
    ]
  },
  suffix: {
    code: '.code.js',
    test: '.test.js',
    spec: '.spec.yaml'
  },
  doc: {
  }
}, JSON.parse(fs.readFileSync(path.join(process.cwd(), '.ruorc'))))

if (!config.target) {
  config.target = config.source
}
config.root = process.cwd()
config.source = path.join(config.root, config.source)
config.target = path.join(config.root, config.target)
config.env = process.env.NODE_ENV || 'development'
config.templatePath = config.templatePath && path.join(config.root, config.templatePath)
debug('config', config)

module.exports = config
