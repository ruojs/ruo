var webpack = require('webpack')
var path = require('path')
var loaders = require('./webpack.loaders')

module.exports = {
  entry: [
    'webpack-dev-server/client?http://0.0.0.0:8080',
    'webpack/hot/only-dev-server',
    './src/index.js'
  ],
  devtool: process.env.WEBPACK_DEVTOOL || 'source-map',
  output: {
    path: path.join(__dirname, 'dist/assets'),
    publicPath: '/assets',
    filename: 'bundle.js'
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
      loader: 'standard-loader',
      query: {
        snazzy: false
      }
    }],
    loaders: loaders
  },
  devServer: {
    contentBase: './dist',
    noInfo: true,
    hot: true,
    inline: true,
    historyApiFallback: true
  },
  plugins: [
    new webpack.NoErrorsPlugin()
  ]
}
