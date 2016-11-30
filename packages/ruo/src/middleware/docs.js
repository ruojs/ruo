const joinPath = require('path').join

const Router = require('router')
const cors = require('cors')
const serveStatic = require('serve-static')
const _ = require('lodash')

const config = require('../config')

const index = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title></title>
  </head>
  <body>
    <div id="container"></div>
    <script>
        var SWAGGER_RENDERER = {
            basename: '/',
            spec: '${config.specPath}'
        }
    </script>
    <script src="${config.docPath}/assets/bundle.min.js"></script>
    <link rel="stylesheet" href="${config.docPath}/assets/highlight-github-gist.css">
  </body>
</html>`

module.exports = (definition) => {
  const router = Router()
  if (config.env !== 'production') {
    router.use(cors())

    // return full spec definition
    router.get(config.specPath, (req, res) => {
      res.send(patternPropertiesToProperties(_.clone(definition)))
    })

    router.get(config.docPath, (req, res, next) => {
      res.send(index)
    })
    router.use(joinPath(config.docPath, 'assets'), serveStatic(joinPath(__dirname, '../../resources/ruo-ui')))
  }
  return router
}

function patternPropertiesToProperties (schema) {
  if (typeof schema === 'object') {
    _.forEach(schema, (value, key) => {
      patternPropertiesToProperties(value)

      if (key === 'patternProperties') {
        schema.properties = schema.properties || {}
        _.forEach(schema.patternProperties, (innerValue, innerKey) => {
          schema.properties[`pattern ${innerKey}`] = innerValue
          patternPropertiesToProperties(innerValue)
        })
      }
    })
  }

  return schema
}
