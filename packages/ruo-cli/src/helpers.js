const spawnSync = require('child_process').spawnSync

const debug = require('debug')('ruo-cli')
const _ = require('lodash')

exports.execute = (command, args, customEnv) => {
  debug('command', command)
  debug('args', args)
  let exec = spawnSync

  let env = Object.assign({}, process.env)
  env.PATH = env.PATH + ':' + 'node_modules/.bin'
  _.assign(env, customEnv)

  let res = exec(command, args, {
    stdio: 'inherit',
    env
  })

  if (res.error) {
    console.error(res.error); // eslint-disable-line
  }
  process.exit(res.status)
}

// remove object if fn(obj) returns true
exports.filterByFn = (fn, obj) => {
  if (_.isArray(obj)) {
    let data = []
    _.each(obj, (value) => {
      if (!fn(value)) {
        data.push(exports.filterByFn(fn, value))
      }
    })
    return data
  } else if (_.isObject(obj)) {
    let data = {}
    _.each(obj, (value, key) => {
      if (!fn(value)) {
        data[key] = exports.filterByFn(fn, value)
      }
    })
    return data
  }

  return obj
}
