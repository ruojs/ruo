# ruo
> Yet Another RESTful API framework

## Installation

    npm install --save ruo


## Usage

    const express = require('express');

    const {createApplicationAsync} = require('ruo');

    const app = express();
    const root = '/path/to/application/root';

    createApplicationAsync(app, root);

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
