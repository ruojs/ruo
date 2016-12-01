const fs = require('fs')
const path = require('path')

const _ = require('lodash')
const debug = require('debug')('ruo')

const rc = _.merge({
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

if (!rc.target) {
  rc.target = rc.source
}
rc.root = process.cwd()
rc.source = path.join(rc.root, rc.source)
rc.target = path.join(rc.root, rc.target)
rc.env = process.env.NODE_ENV || 'development'
rc.templatePath = rc.templatePath && path.join(rc.root, rc.templatePath)
debug('rc', rc)

module.exports = rc
