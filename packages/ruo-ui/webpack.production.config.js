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
  standard: {
    fix: true
  },
  module: {
    preLoaders: [{
      test: /\.js|jsx$/,
      exclude: /node_modules/,
      loader: 'standard-loader'
    }],
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
