import React from 'react'

import Header from './Header'
import Sidebar from './Sidebar'
import Index from './Index'
import AppStore from '../stores/AppStore'

import { Row, Col } from 'antd'
import $ from 'jquery'

import './App.css'

function getState () {
  return {
    spec: AppStore.getSpec()
  }
}

export default class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = getState()
  }

  componentDidMount () {
    AppStore.addChangeListener(this._onChange.bind(this))
  }

  componentWillUnmount () {
    AppStore.removeChangeListener(this._onChange.bind(this))
  }

  componentWillReceiveProps (nextProps) {
    // FIXME
    // this._scrollToTop()
  }

  _onChange () {
    this.setState(getState())
  }

  _scrollToTop () {
    $('html, body').animate({
      scrollTop: 0
    }, {
      duration: 800
    })
  }

  render () {
    $(window).scroll(function () {
      if ($(this).scrollTop() > 100) {
        $('#scroll-top').fadeIn(100)
      } else {
        $('#scroll-top').fadeOut(0)
      }
    })

    const {spec} = this.state
    if (!spec) {
      return <p>Loading...</p>
    }

    let {location: {query}} = this.props

    const {title, version} = spec.info
    return <div className='container'>
      <Header title={title} version={version} spec={spec} />
      <div className='main-wrapper'>
        <Row>
          <Col span={6}>
            <aside className='sidebar'>
              <Sidebar spec={spec} query={query} />
            </aside>
          </Col>
          <Col span={18} className='main-container'>
            {this.props.children ? React.cloneElement(this.props.children, {query}) : <Index spec={spec} />}
          </Col>
        </Row>
      </div>
      <div id='scroll-top' onClick={this._scrollToTop.bind(this)} />
    </div>
  }
}
