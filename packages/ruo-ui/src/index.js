import React from 'react'
import {render} from 'react-dom'
import {Router, Route, hashHistory} from 'react-router'
import useBasename from 'history/lib/useBasename'
import 'whatwg-fetch'

import AppActionCreators from './actions/AppActionCreators'
import App from './components/App'
import Operation from './components/Operation'
import Appendix from './components/Appendix'

import 'antd/dist/antd.css'

AppActionCreators.getSpec()

render((
  <Router history={useBasename(() => hashHistory)({basename: SWAGGER_RENDERER.basename})}>
    <Route path='/' component={App}>
      <Route path='/operation' component={Operation} />
      <Route path='/appendix' component={Appendix} />
    </Route>
  </Router>
), document.getElementById('container'))
