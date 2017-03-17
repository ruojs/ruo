const path = require('path')

const rc = require('rc')
const debug = require('debug')('ruo')

function loadStaticConfig () {
  const config = rc('ruo', {
    name: 'ruo',
    source: '.',
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
  })

  if (!config.target) {
    config.target = config.source
  }
  config.root = process.cwd()
  config.source = path.join(config.root, config.source)
  config.target = path.join(config.root, config.target)
  config.env = process.env.NODE_ENV || 'development'
  config.templatePath = config.templatePath && path.join(config.root, config.templatePath)
  debug('rc', config)
  return config
}

module.exports = loadStaticConfig()
// used in unittest
module.exports.loadStaticConfig = loadStaticConfig
