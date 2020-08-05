const path = require('path');

module.exports = {
  entry: {
    index: './src/index.js',
    worker: './src/worker.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  node: {
    fs: "empty",
  }
};
