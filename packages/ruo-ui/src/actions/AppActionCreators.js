import Debug from 'debug'
import {resolveRefs as resolve} from 'json-refs'
import _ from 'lodash'

import Dispatcher from '../dispatcher'
import {ActionTypes} from '../constants/AppConstants.js'

const debug = Debug('swagger-renderer:actions')

module.exports = {
  getSpec () {
    let promise
    if (typeof SWAGGER_RENDERER.spec === 'string') {
      promise = fetch(SWAGGER_RENDERER.spec, {credentials: 'include'})
                  .then((response) => response.json())
                  .then((spec) => resolve(spec))
    } else {
      promise = resolve(SWAGGER_RENDERER.spec)
    }

    promise
      .then((result) => result.resolved)
      .then((spec) => {
        _.forEach(spec.paths, (operations, path) => {
          _.forEach(operations, (operation, method) => {
            operation.path = path
            operation.method = method
          })
        })
        return spec
      })
    .then((spec) => {
      debug('spec', spec)
      Dispatcher.dispatch({
        type: ActionTypes.GET_SPEC,
        spec
      })
    })
    .catch((err) => {
      console.error(err.stack) // eslint-disable-line
    })
  }
}
