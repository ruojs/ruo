const fs = require('fs')
const path = require('path')

const YAML = require('js-yaml')
const glob = require('glob')
const _ = require('lodash')

const config = require('../config')
const translate = require('../translate')

module.exports = parseAsync

async function parseAsync ({root = config.target, dynamicDefinition = {}} = {}) {
  const definition = YAML.load(fs.readFileSync(root + '/spec/swagger.yaml'))
  definition.paths = glob.sync(`**/*${config.suffix.spec}`, {cwd: root}).reduce((paths, file) => {
    const location = path.join(root, file)
    const yaml = YAML.load(fs.readFileSync(location, 'utf8'))
    if (config.shadow) {
      _.assign(paths, yaml)
    } else {
      const name = translate.fromSpec(file)
      paths[name] = yaml
    }
    return paths
  }, {});
  ['definitions', 'parameters'].forEach((target) => {
    definition[target] = loadFiles(`spec/${target}/*.yaml`, root)
  })
  definition['x-pages'] = loadFiles('spec/pages/*.md', root)
  if (isExist(root + '/spec/errors.yaml')) {
    definition['x-errors'] = YAML.load(fs.readFileSync(root + '/spec/errors.yaml'))
  }

  // merge config.swagger and swagger.yaml
  _.merge(definition, dynamicDefinition)

  return definition
}

function loadFiles (pattern, root) {
  return glob.sync(pattern, {cwd: root}).reduce((defs, file) => {
    const location = path.join(root, file)
    const name = path.parse(file).name
    defs[name] = fs.readFileSync(location, 'utf8')
    if (path.extname(file) === '.yaml') {
      defs[name] = YAML.load(defs[name])
    }
    return defs
  }, {})
}

function isExist (file) {
  try {
    fs.accessSync(file)
    return true
  } catch (err) {
    return false
  }
}
