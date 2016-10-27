import React from 'react'

import marked from '../marked'

export default class Sidebar extends React.Component {
  render () {
    const pages = this.props.spec['x-pages']

    return <div className='markdown' dangerouslySetInnerHTML={{__html: marked(pages.index)}} />
  }
}
