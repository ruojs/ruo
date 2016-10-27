import React from 'react'
import _ from 'lodash'
import SyntaxHighlighter from 'react-syntax-highlighter'
import gist from 'react-syntax-highlighter/dist/styles/github-gist'

import marked from '../marked'
import utility from '../utility'
import AppStore from '../stores/AppStore'
import { Table } from 'antd'

export default class Appendix extends React.Component {
  render () {
    const spec = AppStore.getSpec()
    const {location: {query: {handler}}} = this.props

    if (handler === 'x-errors') {
      let data = _.values(spec['x-errors'])
      let columns = [{
        title: '代码',
        dataIndex: 'code',
        width: '10%'
      }, {
        title: '文本内容',
        dataIndex: 'message',
        width: '45%'
      }, {
        title: '描述',
        dataIndex: 'description',
        width: '45%'
      }]
      let example = {
        'error_code': '21402',
        'request': 'PUT /operators/',
        'message': 'Operator already exists.'
      }
      return <section className='markdown'>
        <h2>全局错误码</h2>
        <p>所有接口的错误信息都要JSON格式返回，返回值格式</p>
        <SyntaxHighlighter language='json' style={gist}>
          {JSON.stringify(example, null, '  ')}
        </SyntaxHighlighter>
        <p>
          其中，错误代码 error_code 由两部分组成。
          第1位为错误级别，1表示系统级别错误，2表示模块级别错误,
          第2、3位表示模块代码，后两位表示具体的错误代码;
        </p>
        <Table columns={columns} dataSource={data} pagination={false} />
      </section>
    }

    const securityDefinitions = utility.parseSecurityDefinitions(spec.securityDefinitions)
    let security
    securityDefinitions.some((_security) => {
      security = _security
      return _security['x-securityHandler'] === handler
    })
    return <div className='markdown'>
      <h2>{security['x-securityHandler'].toUpperCase()} 验证</h2>
      <p dangerouslySetInnerHTML={{__html: marked(security.description)}} />
    </div>
  }
}
