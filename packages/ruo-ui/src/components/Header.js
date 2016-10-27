import React from 'react'
import './Header.css'

import { Row, Col } from 'antd'

class Header extends React.Component {
  render () {
    return (
      <header id='header' className='clearfix'>
        <Row>
          <Col span={12}>
            <a id='title' href={SWAGGER_RENDERER.basename}>
              <span>{this.props.title} </span>
            </a>
          </Col>
          <Col span={12}>
            <span>{this.props.version} </span>
          </Col>
        </Row>
      </header>
    )
  }
}

Header.propTypes = {
  title: React.PropTypes.string.isRequired,
  version: React.PropTypes.string.isRequired
}

export default Header
