/**
 * This module transform between local file location and API URI.
 */
const path = require('path')

const rc = require('./rc')

const DEST_PREFIX = 'api'

// '/demo/hello' => 'api/demo/hello${suffix}'
function to (suffix, uri, destPrefix) {
  destPrefix = destPrefix || DEST_PREFIX
  const pathObj = path.parse(path.join(destPrefix, uri))
  return path.join(pathObj.dir, pathObj.base + suffix)
}

// 'api/demo/hello${suffix}' => '/demo/hello'
function from (suffix, location, destPrefix) {
  destPrefix = destPrefix || DEST_PREFIX
  return location.slice(destPrefix.length, -suffix.length)
}

function is (suffix, location) {
  const index = location.indexOf(suffix)
  if (index === -1) {
    return false
  }

  return index === (location.length - suffix.length)
}

const SUFFIX_CODE = rc.suffix.code
const SUFFIX_TEST = rc.suffix.test
const SUFFIX_SPEC = rc.suffix.spec

module.exports = {
  // '/demo/hello' => '/demo/hello.code.js'
  toCode: to.bind(null, SUFFIX_CODE),
  // '/demo/hello' => '/demo/hello.test.js'
  toTest: to.bind(null, SUFFIX_TEST),
  // '/demo/hello' => '/demo/hello.spec.yaml'
  toSpec: to.bind(null, SUFFIX_SPEC),

  // 'api/demo/hello.code.js' => '/demo/hello'
  fromCode: from.bind(null, SUFFIX_CODE),
  // 'api/demo/hello.test.js' => '/demo/hello'
  fromTest: from.bind(null, SUFFIX_TEST),
  // 'api/demo/hello.spec.yaml' => '/demo/hello'
  fromSpec: from.bind(null, SUFFIX_SPEC),

  isCode: is.bind(null, SUFFIX_CODE),
  isTest: is.bind(null, SUFFIX_TEST),
  isSpec: is.bind(null, SUFFIX_SPEC)
}
