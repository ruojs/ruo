import React from 'react'

import SyntaxHighlighter from 'react-syntax-highlighter'
import gist from 'react-syntax-highlighter/dist/styles/github-gist'

export default class Example extends React.Component {
  render () {
    let { examples } = this.props
    if (typeof examples === 'object') {
      examples = JSON.stringify(examples, null, '  ')
    }

    return <SyntaxHighlighter language='json' style={gist}>{examples}</SyntaxHighlighter>
  }
}
