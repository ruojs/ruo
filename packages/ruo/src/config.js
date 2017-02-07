const path = require('path')

const _ = require('lodash')
const loadConfig = require('mcfg')
const debug = require('debug')('ruo')

const rc = require('./rc')

// load user configuration files
const config = loadConfig(path.join(rc.target, 'config'))

// use package.version as default swagger.version
const pkg = require(path.join(rc.root, 'package.json'))
if (!_.get(config, 'swagger.info.version')) {
  _.set(config, 'swagger.info.version', pkg.version)
}
debug('user config', config)

module.exports = config
