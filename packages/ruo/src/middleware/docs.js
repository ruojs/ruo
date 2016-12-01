const joinPath = require('path').join

const Router = require('router')
const cors = require('cors')
const serveStatic = require('serve-static')
const _ = require('lodash')

const rc = require('../rc')

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
            spec: '${rc.specPath}'
        }
    </script>
    <script src="${rc.docPath}/assets/bundle.min.js"></script>
    <link rel="stylesheet" href="${rc.docPath}/assets/highlight-github-gist.css">
  </body>
</html>`

module.exports = (definition) => {
  const router = Router()
  if (rc.env !== 'production') {
    router.use(cors())

    // return full spec definition
    router.get(rc.specPath, (req, res) => {
      res.send(patternPropertiesToProperties(_.clone(definition)))
    })

    router.get(rc.docPath, (req, res, next) => {
      res.send(index)
    })
    router.use(joinPath(rc.docPath, 'assets'), serveStatic(joinPath(__dirname, '../../resources/ruo-ui')))
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
