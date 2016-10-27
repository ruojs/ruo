var webpack = require('webpack')
var path = require('path')
var loaders = require('./webpack.loaders')

module.exports = {
  entry: [
    './src/index.js'
  ],
  output: {
    path: path.join(__dirname, 'dist/assets'),
    filename: 'bundle.min.js'
  },
  resolve: {
    extensions: ['', '.js']
  },
  module: {
    loaders: loaders
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    })
  ]
}
