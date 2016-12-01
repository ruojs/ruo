import React, { Component } from 'react'
import { Input, Select, Button, Icon, message } from 'antd'
import classNames from 'classnames'
import './SearchInput.css'
const Option = Select.Option

class SearchInput extends Component {
  constructor (props) {
    super(props)
    this.state = {
      data: [],
      value: '',
      focus: false
    }
  }
  _handleChange (value) {
    this.setState({ value })
    this.props.handleChange(value, data => this.setState({ data }))
  }
  _handleSelect (key) {
    this.setState({ value: key })
    this.props.handleSelect(key)
  }
  _handleSubmit () {
    this.state.data.length ? this._handleSelect(this.state.data[0].value) : message.error('未找到匹配项')
  }
  _handleFocus () {
    this.setState({ focus: true })
  }
  _handleBlur () {
    this.setState({ focus: false })
  }
  render () {
    const btnCls = classNames({
      'ant-search-btn': true,
      'ant-search-btn-noempty': !!this.state.value.trim()
    })
    const searchCls = classNames({
      'ant-search-input': true,
      'ant-search-input-focus': this.state.focus
    })
    const options = this.state.data.map(d => <Option key={d.value}>{d.text}</Option>)
    return (
      <div className='ant-search-input-wrapper' style={this.props.style}>
        <Input.Group className={searchCls}>
          <Select
            combobox
            value={this.state.value}
            placeholder={this.props.placeholder}
            notFoundContent=''
            defaultActiveFirstOption={false}
            showArrow={false}
            filterOption={false}
            onChange={this._handleChange.bind(this)}
            onFocus={this._handleFocus.bind(this)}
            onBlur={this._handleBlur.bind(this)}
            onSelect={this._handleSelect.bind(this)}
            style={{top: 26}}
          >
            {options}
          </Select>
          <div className='ant-input-group-wrap'>
            <Button className={btnCls} onClick={this._handleSubmit.bind(this)}>
              <Icon type='search' />
            </Button>
          </div>
        </Input.Group>
      </div>
    )
  }
}

export default SearchInput
