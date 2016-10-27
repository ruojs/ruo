import {EventEmitter} from 'events'

import {ActionTypes} from '../constants/AppConstants'
import Dispatcher from '../dispatcher'

const CHANGE_EVENT = 'change'
let spec

const AppStore = Object.assign({}, EventEmitter.prototype, {
  addChangeListener (callback) {
    this.on(CHANGE_EVENT, callback)
  },

  removeChangeListener (callback) {
    this.removeListener(CHANGE_EVENT, callback)
  },

  emitChange () {
    this.emit(CHANGE_EVENT)
  },

  getSpec () {
    return spec
  }
})

AppStore.dispatcherToken = Dispatcher.register((action) => {
  switch (action.type) {

    case ActionTypes.GET_SPEC:
      spec = action.spec
      AppStore.emitChange()
      break
    default:
      // Do nothing
  }
})

module.exports = AppStore
