const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: {
    index: './src/index.js',
    worker: './src/worker.js'
  },
  devtool: 'source-map',
  plugins: [
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'docs'),
  },
  node: {
    fs: 'empty',
  }
}
