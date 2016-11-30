import qs from 'querystring'

import React from 'react'
import Debug from 'debug'
import { Link } from 'react-router'
import { Collapse } from 'antd'

import marked from '../marked'
import AppStore from '../stores/AppStore'
import Example from './Example'
import utility from '../utility'
import TreeView from './TreeView'

import './Operation.css'

const debug = Debug('swagger-renderer:components')
const Panel = Collapse.Panel

export default class Operation extends React.Component {
  _renderAuthorizations (securityDefinitions, security) {
    if (security && security.length) {
      let handlers = security
        .reduce((auths, authorization) => auths.concat(Object.keys(authorization)), [])
        .reduce((handlers, name) => {
          let handler = securityDefinitions[name]['x-securityHandler']
          if (handlers.indexOf(handler) === -1) {
            handlers.push(handler)
          }
          return handlers
        }, [])
      return <p>
        通过
        {
          handlers.map((handler, index) => {
            return <span key={index}>{index !== 0 && '或'}<Link to={{pathname: '/appendix', query: {handler}}}> {handler.toUpperCase()} </Link></span>
          })
        }
        授权
      </p>
    }
    return <p>无须授权</p>
  }

  _renderParameters (parameters, operation) {
    if (!parameters || parameters.length === 0) {
      return <p>无</p>
    }

    let examples
    let schema
    let data = {}
    if (parameters[0].in === 'body') {
      const parameter = parameters[0]
      schema = parameter.schema
      examples = parameter['x-examples'] || utility.schemaToJson(schema)
      data = schema
    } else {
      examples = utility.fieldsToJson(parameters)
      const properties = {}
      const required = []
      parameters.map((parameter, index) => {
        properties[parameter.name] = parameter
        if (parameter.required) {
          required.push(parameter.name)
        }
      })
      data = { properties, required }
    }

    if (operation.method === 'get' || operation.method === 'delete') {
      examples = <pre><code>{operation.path}?{qs.stringify(examples)}</code></pre>
    } else {
      examples = <Example examples={examples} />
    }
    examples = <div>
      <h4>样例</h4>
      {examples}
    </div>

    return (
      <div>
        <TreeView schema={data} />
        {examples}
      </div>
    )
  }

  _renderResponses (responses) {
    return Object.keys(responses).map((status, index) => {
      const response = responses[status]
      let examples
      if (response['x-examples']) {
        examples = response['x-examples']
      } else {
        examples = utility.schemaToJson(response.schema)
      }

      if (status === 'default') {
        if (index === 0) {
          // 只有 default response
          status = ''
        } else {
          status = '失败'
        }
      } else {
        status = `状态码 ${status}`
      }

      return (
        <Panel header={status} key={index}>
          <p dangerouslySetInnerHTML={{__html: marked(response.description)}} />
          <TreeView schema={response.schema} />
          <Example examples={examples} />
        </Panel>
      )
    })
  }

  render () {
    const spec = AppStore.getSpec()
    const {query: {method, path}} = this.props
    const operation = spec.paths[path][method]
    debug('operation', operation)

    const description = operation.description || operation.summary
    return (
      <section className='markdown'>
        <h2>接口</h2>
        <p dangerouslySetInnerHTML={{__html: marked(description)}} />
        <pre><code>{operation.method.toUpperCase()} {operation.path}</code></pre>

        <h2>授权</h2>
        {this._renderAuthorizations(spec.securityDefinitions, operation.security)}

        <h2>参数</h2>
        {this._renderParameters(operation.parameters, operation)}

        <h2>响应</h2>
        <div>
          <Collapse bordered={false}>
            {this._renderResponses(operation.responses)}
          </Collapse>
        </div>

        <p>
          错误返回值与错误代码，参见<Link to={{pathname: '/appendix', query: {handler: 'x-errors'}}}>错误代码说明</Link>
        </p>
      </section>
    )
  }
}
