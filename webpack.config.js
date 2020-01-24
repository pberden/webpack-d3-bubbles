const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',

  entry: './src/index.js',

  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
  },

  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'Development',
    }),
    new CopyPlugin([
      { from: 'src/data', to: 'data' },
    ]),
  ],

  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },

};