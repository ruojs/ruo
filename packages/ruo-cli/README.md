# ruo-cli
> Command line utility for ruo projects

## Installation

    npm install -g ruo-cli

## Usage

Run development server and watch file changes

    ruo 

Add Code, Test, Spec

    ruo gen

View API spec, open localhost:8088/doc when dev server is running

Setup test server and run unittest

    ruo test

Or

    ruo t

Run `oauth` unittest

    ruo t -g oauth

Run `dist/api/accounts-test.js` tests

    ruo t -f dist/api/accounts-test.js

Getting coverage result

    ruo cover
    open ./coverage/index.html

Lint source code

    ruo lint

Generate API documentation

    ruo doc

Generate spec

    ruo spec
