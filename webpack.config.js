var webpack = require('webpack');

module.exports = {
  entry: './lib/index',
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel' }
    ]
  },
  output: {
    filename: 'dist/ReactDnDTouchPointerEventsBackend.min.js',
    libraryTarget: 'umd',
    library: 'ReactDnDTouchPointerEventsBackend'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    })
  ]
}
