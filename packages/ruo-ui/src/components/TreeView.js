import React, { Component } from 'react'
import classNames from 'classnames'
import { Icon } from 'antd'
import marked from '../marked'
import './TreeView.css'

class TreeView extends Component {
  constructor (props) {
    super(props)
    const { schema } = props
    this.state = {
      schema,
      expands: {}
    }
  }
  handleParamClick (key) {
    let newExpands = this.state.expands
    newExpands[key] = !newExpands[key]
    this.setState({
      newExpands
    })
  }
  renderType (schema) {
    let { type } = schema
    const { items } = schema
    if (type) {
      if (type === 'array' && items) {
        return (
          <span>
            <span className='param-type array'>{items.type}</span>
            {this.renderRange.bind(this)(items)}
            {this.renderPattern.bind(this)(items)}
          </span>
        )
      } else {
        return (
          <span>
            <span className='param-type'>{type}</span>
            {this.renderRange.bind(this)(schema)}
            {this.renderPattern.bind(this)(schema)}
          </span>
        )
      }
    }
  }
  renderRange (schema) {
    const { maxLength = '', minLength = '' } = schema
    if (minLength && maxLength) {
      return (
        <span className='param-range'>
          {`[ ${minLength} .. ${maxLength} ] characters `}
        </span>
      )
    } else if (minLength && !maxLength) {
      return (
        <span className='param-range'>
          {`>= ${minLength} characters `}
        </span>
      )
    } else if (!minLength && maxLength) {
      return (
        <span className='param-range'>
          {`<= ${maxLength} characters `}
        </span>
      )
    }
  }
  renderPattern (schema) {
    const { pattern } = schema
    if (pattern) {
      // return <span className='param-pattern'>{pattern}</span>
      return
    }
  }
  renderEnum (enumItems) {
    if (enumItems) {
      return (
        <div className='param-enum'>
          {
            enumItems.map((item, index) => {
              return <span key={index} className='param-enum-value'>{(typeof item === 'string') ? `'${item}'` : item }</span>
            })
          }
        </div>
      )
    }
  }
  renderSchema (prop, key) {
    const { items, properties, type } = prop
    if (items && items.type === 'object' && type) {
      return (
        <tr className='param-schema'>
          <td colSpan='2'>
            <div className='param-schema-general'>
              {this.renderTree.bind(this)(items, type)}
            </div>
          </td>
        </tr>
      )
    } else if (properties && type) {
      return (
        <tr key={key} className='param-schema'>
          <td colSpan='2'>
            <div className='param-schema-general'>
              {this.renderTree.bind(this)(prop, type)}
            </div>
          </td>
        </tr>
      )
    }
  }
  renderTree (schema, parentType) {
    let { properties = {} } = schema
    const { patternProperties, required = [] } = schema

    // Combine pattern properties
    if (patternProperties) {
      properties = Object.assign({}, properties, patternProperties)
    }

    // Set Required attribute
    for (let name in properties) {
      if (typeof required === 'boolean') {
        properties[name].required = required
      } else if (Array.isArray(required)) {
        properties[name].required = required.indexOf(name) !== -1
      } else {
        properties[name].required = false
      }
    }

    // If schema properties type is array
    if (schema.type === 'array') {
      const { items, type } = schema
      if (items['type'] === 'object') {
        return this.renderTree(items, type)
      }
      return (
        <div>
          <span className='param-type'>Array [{items['type']}]</span>
          <span className='param-required'>Required</span>
        </div>
      )
    }

    const wrapCls = classNames({
      'params-wrap': true,
      'params-array': parentType === 'array'
    })

    return (
      <table className={wrapCls}>
        <tbody>
          {
        Object.keys(properties).map((prop, index) => {
          const key = `${index}_${prop}`

          const { items, properties: subProps } = properties[prop]

          const paramCls = classNames({
            'param': true,
            'last': index === Object.keys(properties).length - 1,
            'complex': (!!items && items['type'] === 'object') || !!subProps,
            'expanded': this.state.expands[key]
          })

          return ([
            <tr key={key} className={paramCls}>
              <td className='param-name'>
                <span className='param-name-wrap' onClick={this.handleParamClick.bind(this, key)}>
                  <span className='param-name-content'>{prop}</span>
                  {
                    (!!items && items['type'] === 'object') || !!subProps
                      ? <Icon type='down' />
                      : ''
                  }
                </span>
              </td>
              <td className='param-info'>
                <div>
                  {this.renderType.bind(this)(properties[prop])}
                  {
                    properties[prop]['required'] ? <span className='param-required'>Required</span> : ''
                  }
                  {this.renderEnum.bind(this)(properties[prop]['enum'])}
                </div>
                {
                  properties[prop]['description'] ? <div className='param-description'><p dangerouslySetInnerHTML={{__html: marked(properties[prop]['description'])}} /></div> : ''
                }
              </td>
            </tr>,
            this.renderSchema.bind(this)(properties[prop], `${key}_sub`)
          ])
        })
      }
        </tbody>
      </table>
    )
  }
  render () {
    let { schema } = this.props
    return (
      <div>
        {this.renderTree.bind(this)(schema)}
      </div>
    )
  }
}

export default TreeView
