module.exports = [
  {
    test: /\.js?$/,
    exclude: /(node_modules|bower_components)/,
    loaders: ['react-hot', 'babel']
  },
  {
    test: /\.json$/,
    loader: 'json'
  },
  {
    test: /\.css$/,
    loader: 'style-loader!css-loader'
  }
]
