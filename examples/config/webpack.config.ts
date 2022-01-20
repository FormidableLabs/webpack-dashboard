/**
 * No-op build with TS config to see if webpack-cli bombs out.
 */

import DashboardPlugin from '../../plugin';

import * as path from 'path';
import * as webpack from 'webpack';
const webpackVers = webpack.version;

const cwd = `${process.cwd()}/examples/${process.env.EXAMPLE}`;
if (!process.env.EXAMPLE) {
  throw new Error("EXAMPLE is required");
}

const mode = process.env.WEBPACK_MODE || "development";

const config: webpack.Configuration = {
  mode: 'development',
  entry: {
    bundle: "./src/index.js"
  },
  context: path.resolve(cwd),
  output: {
    path: path.resolve(cwd, `dist-ts-${mode}-${webpackVers}`),
    pathinfo: true,
    filename: "[name].js"
  },
  devtool: false,
  plugins: [
    new DashboardPlugin()
  ]
};

export default config;
