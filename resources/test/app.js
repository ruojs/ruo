const bodyParser = require('body-parser')

const ruo = require('../../src')

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
    const app = await ruo.createApplicationAsync()

    app.use(bodyParser.urlencoded({extended: true}))
    app.use(bodyParser.json())
    app.use(ruo.restMiddleware())

    return app
  } catch (err) {
    console.log(err.stack); // eslint-disable-line
    process.exit(1)
  }
}
