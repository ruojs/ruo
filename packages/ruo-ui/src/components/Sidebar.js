import React from 'react'
import {Link} from 'react-router'
import _ from 'lodash'
import Debug from 'debug'

import utility from '../utility'

import './Sidebar.css'
import { Menu } from 'antd'
const SubMenu = Menu.SubMenu
const debug = Debug('swagger-renderer:components')

const APPENDIX_RESOURCE = 'appendix'
export default class Sidebar extends React.Component {
  constructor (props) {
    super(props)
    // group operations by resources (tag)
    const {spec: {tags, paths}} = props

    let resources = _.clone(tags)
    let map = {}
    resources.forEach((tag) => {
      map[tag.name] = tag
      tag.operations = []
    })

    _.forEach(paths, (operations) => {
      _.forEach(operations, (operation) => {
        const tagName = operation.tags[0]
        if (!map[tagName]) {
          console.error(`${tagName} in ${operation.method} ${operation.path} not defined`)
          return
        }
        map[tagName].operations.push(operation)
      })
    })
    debug('resources', resources)

    this.state = {
      resources,
      current: this._getCurrentResource(this.props)
    }
  }

  _getCurrentResource (props) {
    const {spec: {paths}, query: {method, path, handler}} = props

    if (!method && !path) {
      if (handler) {
        return {
          resource: APPENDIX_RESOURCE,
          operation: handler
        }
      }

      return {}
    }

    return {
      resource: paths[path][method].tags[0],
      operation: method + '_' + path
    }
  }

  componentWillReceiveProps (nextProps) {
    this.setState({current: this._getCurrentResource(nextProps)})
  }

  _renderOperation (operation, index) {
    const {method, path} = operation
    const title = operation.summary || `${method.toUpperCase()} ${path}`
    return (
      <Menu.Item key={method + '_' + path}>
        <Link to={{pathname: '/operation', query: {method, path}}}>{title}</Link>
      </Menu.Item>
    )
  }

  _renderResources (resources) {
    return _.map(resources, (resource) => {
      return (
        <SubMenu key={resource.name} title={resource.description}>
          {resource.operations.map(this._renderOperation.bind(this))}
        </SubMenu>
      )
    })
  }

  _renderAppendix (appendix) {
    const resource = 'appendix'
    return (
      <SubMenu key={resource} title='附录'>
        {_.map(appendix, (title, handler) => {
          return <Menu.Item key={handler}>
            <Link to={{pathname: '/appendix', query: {handler}}}>{title}</Link>
          </Menu.Item>
        })}
      </SubMenu>
    )
  }

  _toggle (openKeys) {
    const latestOpenKey = openKeys.find(key => this.state.current.resource !== key)
    this.setState({
      current: Object.assign({}, this.state.current, { resource: latestOpenKey })
    })
  }

  render () {
    let {resources} = this.state
    let {spec: {securityDefinitions}} = this.props
    let appendix = {}

    securityDefinitions = utility.parseSecurityDefinitions(securityDefinitions)
    securityDefinitions.map((item) => {
      let handler = item['x-securityHandler']
      appendix[handler] = handler.toUpperCase() + ' 验证'
    })
    appendix['x-errors'] = '全局错误码'

    return (
      <Menu
        openKeys={[this.state.current.resource]}
        onOpenChange={this._toggle.bind(this)}
        selectedKeys={[this.state.current.operation]}
        mode='inline'>
        {this._renderResources(resources)}
        {this._renderAppendix(appendix)}
      </Menu>
    )
  }
}
