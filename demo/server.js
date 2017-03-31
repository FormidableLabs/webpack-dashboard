/* eslint-disable no-console,no-magic-numbers */
"use strict";

const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const config = require("./webpack.config");

const compiler = webpack(config);

new WebpackDevServer(compiler, {
  publicPath: config.output.publicPath,
  quiet: true,
  hot: true,
  historyApiFallback: true
}).listen(3000, "localhost", err => {
  if (err) {
    console.log(err);
  }

  console.log("Listening at http://localhost:3000/");
});
