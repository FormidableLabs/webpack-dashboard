/**
 * No-op build with TS config to see if webpack-cli bombs out.
 */

import DashboardPlugin from '../../plugin';

import * as path from 'path';
import * as webpack from 'webpack';

const config: webpack.Configuration = {
  mode: 'development',
  entry: './foo.js',
  context: path.resolve(__dirname, "../../examples/simple"),
  output: {
    path: path.resolve(__dirname, '../../examples/dist-ts-example'),
    filename: "./src/index.js",
  },
  devtool: false,
  plugins: [
    new DashboardPlugin()
  ]
};

export default config;
