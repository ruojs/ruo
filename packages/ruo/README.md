# ruo
> Yet Another RESTful API framework

## Installation

    npm install --save ruo


## Usage

    const ruo = require('ruo');

    async main() {
      const app = await ruo.createApplicationAsync()

      app.use(ruo.restMiddleware())

      app.listen(8088)
    }

## Development

Lint

    npm run lint

Test

    npm test

Or

    npm t

Run particular test

    npm t -- -g 'some description'

Commit

    git cz

## Credit

* https://github.com/apigee-127/sway
* https://github.com/krakenjs/swaggerize-express
* https://github.com/jshttp/http-errors
