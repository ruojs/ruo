import React from 'react'
import './Header.css'

import { Row, Col } from 'antd'
import SearchInput from './SearchInput'

class Header extends React.Component {
  constructor (props) {
    super(props)
    const {spec: { paths }} = props

    let apiArr = []
    Object.keys(paths).forEach(key => {
      Object.keys(paths[key]).forEach(method => {
        apiArr.push(`${method.toUpperCase()} ${key}`)
      })
    })

    this.state = {
      apiArr: apiArr
    }
  }
  handleApiSearch (value, callback) {
    let timeout
    let currentValue

    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    currentValue = value

    const match = () => {
      const data = []
      this.state.apiArr.forEach(api => {
        if (api.toLowerCase().includes(currentValue.toLowerCase())) {
          data.push({
            value: api,
            text: api
          })
        }
      })
      callback(data)
    }

    timeout = setTimeout(match, 300)
  }
  handleApiSelect (key) {
    const [method, path] = key.split(' ')
    window.location.href = `${window.location.pathname}#/operation?method=${method.toLowerCase()}&path=${encodeURIComponent(path)}`
  }
  render () {
    return (
      <header id='header' className='clearfix'>
        <Row>
          <Col span={22}>
            <a id='title' href={SWAGGER_RENDERER.basename}>
              <span>{this.props.title} </span>
            </a>
            <SearchInput placeholder='API 搜索' handleChange={this.handleApiSearch.bind(this)} handleSelect={this.handleApiSelect.bind(this)} style={{ width: 300, marginLeft: 30 }} />
          </Col>
          <Col span={2}>
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
