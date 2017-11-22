# ruo [![Build Status](https://travis-ci.org/ruojs/ruo.svg?branch=master)](https://travis-ci.org/ruojs/ruo)
> Yet Another RESTful API framework

<img src="https://dl.dropboxusercontent.com/s/flqj2b2ujf3iaon/ruo.png" width="255px" />

## Installation

    npm install --save ruo

## Usage

    const ruo = require('ruo');

    async function main() {
      const app = await ruo.createApplicationAsync()

      app.use(ruo.getRestMiddleware())

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

## Authors

* [CatTail](https://github.com/cattail/)
* [yuzi](https://github.com/yuzima)
