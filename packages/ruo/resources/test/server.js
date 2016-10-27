const express = require('express')
const bodyParser = require('body-parser')

const {createApplicationAsync} = require('../../src')
const createTokenMiddleware = require('./middleware/token')
const createBasicMiddleware = require('./middleware/basic')

const port = 8088

if (module.parent) {
  module.exports = createServer
} else {
  createServer()
    .then((app) => {
      app.listen(port, () => {
        console.log(`Server listen on http://localhost:${port}`); // eslint-disable-line
      })
    })
}

async function createServer () {
  try {
    const app = express()

    app.use(bodyParser.urlencoded({extended: true}))
    app.use(bodyParser.json())

    await createApplicationAsync(app, {
      securityMiddlewares: {
        token: createTokenMiddleware(),
        basic: createBasicMiddleware()
      }
    })

    return app
  } catch (err) {
    console.log(err.stack); // eslint-disable-line
    process.exit(1)
  }
}
