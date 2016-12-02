#!/usr/bin/env node
const path = require('path')

const rc = require('rc')('ruo')
const updateNotifier = require('update-notifier')
const minimist = require('minimist')
const pkg = require('../package.json')
const argv = minimist(process.argv.slice(2))

updateNotifier({
  pkg,
  updateCheckInterval: 0
}).notify({
  defer: false
})

if (argv.v || argv.version) {
  console.log(pkg.version)
  process.exit(0)
}

if (argv.h || argv.help) {
  console.log(`Usage: ruo <command>

Availble commands:

  * [default]
  * build
  * gen
  * test, t
  * cover, c
    `)
  process.exit(0)
}

if (!rc.config) {
  console.error('Not inside ruo project')
  process.exit(1)
}
process.chdir(path.dirname(rc.config))

const command = argv._[0]
if (['doc', 'spec', 'gen'].indexOf(command) !== -1) {
  require(`./${command}`)()
} else {
  const gulp = require('gulp')
  require('./gulpfile')
  gulp.start(command || 'default', (err) => {
    if (err) {
      console.error(err.stack)
      process.exit(1)
    }
  })
}
