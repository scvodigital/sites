const autoprefixer = require('autoprefixer');
const CompressionPlugin = require('compression-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = [
  getConfig('goodmoves'),
]

function getConfig(site) {
  return {
    entry: ['./sites/' + site + '/main.scss', './sites/' + site + '/main.js'],
    output: {
      filename: 'build/' + site + '/main.js',
    },
    module: {
      rules: [{
          test: /\.scss$/,
          use: [{
              loader: 'file-loader',
              options: {
                name: 'build/' + site + '/main.css',
              },
            },
            {
              loader: 'extract-loader'
            },
            {
              loader: 'css-loader'
            },
            {
              loader: 'postcss-loader',
              options: {
                plugins: () => [autoprefixer()],
              },
            },
            {
              loader: 'sass-loader',
              options: {
                includePaths: ['./node_modules'],
              },
            }
          ],
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          query: {
            presets: ['es2015'],
          },
        }
      ],
    },
    plugins: [
      new UglifyJsPlugin({
        uglifyOptions: {
          ecma: 5,
          sourceMap: true
        }
      }),
      new CompressionPlugin(),
    ],
  };
}
