#! /usr/bin/env node
const fs = require('fs')
const path = require('path')

const assetsPath = path.join(path.dirname(require.resolve('ruo-ui')), 'assets')

try {
  fs.symlinkSync(assetsPath, './resources/ruo-ui')
} catch (err) {
  if (err.code !== 'EEXIST') {
    throw err
  }
}
