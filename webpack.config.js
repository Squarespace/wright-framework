var webpack = require('webpack');
var path = require('path');

var scriptsPath = path.resolve(__dirname, 'build', 'scripts');

var sitejs = ['./scripts/site.js'];

var sourceScripts = sitejs;

var config = {
  entry: sourceScripts,
  output: {
    path: scriptsPath,
    filename: 'site-bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  plugins: [
    // new webpack.optimize.UglifyJsPlugin()
  ],
  resolve: {
    modulesDirectories: [
      path.resolve(__dirname, 'node_modules')
    ],
    alias: {
      '@squarespace/layout-base': path.resolve(__dirname, 'node_modules/@squarespace/layout-slideshow/node_modules/@squarespace/layout-base'),
      'lodash/debounce': path.resolve(__dirname, 'node_modules/lodash/function/debounce')
    }
  },
  resolveLoader: {
    modulesDirectories: [
      path.resolve(__dirname, 'node_modules')
    ]
  }
};

module.exports = config;
