import qs from 'querystring'

import React from 'react'
import Debug from 'debug'
import {Link} from 'react-router'
import { Table } from 'antd'

import marked from '../marked'
import AppStore from '../stores/AppStore'
import Example from './Example'
import utility from '../utility'

import './Operation.css'

const debug = Debug('swagger-renderer:components')

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

  _renderType (schema) {
    switch (schema.type) {
      case 'array': {
        let type = schema.type
        if (schema.items) {
          type = `${type} [${schema.items.type}]`
        }
        return type
      }
      case 'string': {
        let type = schema.type
        if (schema.enum) {
          type = <div>
            {type}
            <p>可选值</p>
            <ul style={{listStyle: 'disc'}}>
              {
                schema.enum.map((item) => <li key={item}>{item}</li>)
              }
            </ul>
          </div>
        }
        return type
      }
      default: {
        return schema.type
      }
    }
  }

  _renderParameters (parameters, operation) {
    if (!parameters || parameters.length === 0) {
      return <p>无</p>
    }

    let examples
    let schema
    let data = []
    if (parameters[0].in === 'body') {
      const parameter = parameters[0]
      schema = parameter.schema
      examples = parameter['x-examples'] || utility.schemaToJson(schema)
      if (schema.type === 'object') {
        const required = schema.required || []
        for (let name in schema.properties) {
          const property = schema.properties[name]
          data.push({
            key: name,
            name: name,
            required: String(required.indexOf(name) !== -1),
            type: this._renderType(property),
            description: property.description
          })
        }
      } else if (schema.type === 'array') {
        data.push({
          key: '',
          name: '',
          required: 'true',
          type: this._renderType(schema),
          description: schema.description
        })
      }
    } else {
      examples = utility.fieldsToJson(parameters)
      data = parameters.map((parameter, index) => {
        return {
          key: index,
          name: parameter.name,
          required: String(parameter.required),
          type: this._renderType(parameter),
          description: parameter.description
        }
      })
    }

    if (operation.method === 'get' || operation.method === 'delete') {
      examples = <pre><code>{operation.path}?{qs.stringify(examples)}</code></pre>
    } else {
      examples = <Example examples={examples} schema={schema} />
    }
    examples = <div>
      <h4>样例</h4>
      {examples}
    </div>

    const columns = [{
      title: '参数',
      dataIndex: 'name',
      width: '20%'
    }, {
      title: '必须',
      dataIndex: 'required',
      width: '10%',
      render: text => (text === 'true' ? <span className='required'>{text}</span> : text)
    }, {
      title: '类型',
      dataIndex: 'type',
      width: '10%'
    }, {
      title: '说明',
      dataIndex: 'description',
      render: text => <p dangerouslySetInnerHTML={{__html: marked(text)}} />
    }]
    return (
      <div>
        <Table columns={columns} dataSource={data} pagination={false} />
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

      return <div key={index}>
        <p>
          {status}
        </p>
        <p dangerouslySetInnerHTML={{__html: marked(response.description)}} />
        <Example examples={examples} schema={response.schema} />
      </div>
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
        <div>{this._renderResponses(operation.responses)}</div>

        <p>
          错误返回值与错误代码，参见<Link to={{pathname: '/appendix', query: {handler: 'x-errors'}}}>错误代码说明</Link>
        </p>
      </section>
    )
  }
}
