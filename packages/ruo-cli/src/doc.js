const fs = require('fs')
const path = require('path')

const _ = require('lodash')
const handlebars = require('handlebars')
const mkdirp = require('mkdirp')
const copy = require('ncp')
const del = require('del')
const debug = require('debug')('ruo-cli')
const {rc, parseAsync} = require('ruo')

const {filterByFn} = require('./helpers')

module.exports = () => {
  const DOCS = rc.doc
  const DEST = path.join(rc.target, 'doc')

  const source = fs.readFileSync(path.join(__dirname, '/template/ruo-ui.hbs'), 'utf8')
  const template = handlebars.compile(source)

  mkdirp.sync(DEST)

  _.forEach(DOCS, (tags, name) => {
    // TODO: fix missing `rc.swagger`
    parseAsync({root: rc.source}).then((spec) => {
      selectTags(spec, tags)

      // filter particular security definitions
      let privateSecurityList = []
      for (let key in spec.securityDefinitions) {
        if (spec.securityDefinitions[key]['x-private'] === true) {
          privateSecurityList.push(key)
        }
      }
      debug('filtered security definitions', privateSecurityList)
      spec = filterByFn((obj) => {
        // typeof null === 'object'
        if (obj && typeof obj === 'object') {
          const keys = Object.keys(obj)
          return keys.length === 1 && privateSecurityList.indexOf(keys[0]) !== -1
        }
      }, spec)

      // filter x-private parameters, responses, securitys etc
      spec = filterByFn((obj) => obj && obj['x-private'] === true, spec)
      debug('transformed spec', spec)

      const directory = DEST + '/' + name
      del.sync(directory)
      mkdirp.sync(directory)
      copy(path.join(__dirname, '..', 'node_modules/ruo-ui/dist'), directory, {dereference: true}, (err) => {
        if (err) { throw err }
        const result = template({spec: JSON.stringify(spec, null, 2)})
        fs.writeFileSync(`${directory}/index.html`, result, 'utf8')
      })
    }).catch((err) => {
      console.log(err.stack); // eslint-disable-line
    })
  })

  // filter not selected tags
  function selectTags (spec, tags) {
    spec.tags = spec.tags.filter((tag) => tags.indexOf(tag.name) !== -1)
    _.forEach(spec.paths, (resource, resourceName) => {
      _.forEach(resource, (operation, method) => {
        const hasTag = operation.tags.some((tag) => tags.indexOf(tag) !== -1)
        if (!hasTag) {
          delete resource[method]
        }
      })
      if (Object.keys(resource).length === 0) {
        delete spec.paths[resourceName]
      }
    })
  }
}
