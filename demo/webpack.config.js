"use strict";

const webpack = require("webpack");
const DashboardPlugin = require("../plugin");

module.exports = {
  context: __dirname,
  entry: {
    app: "./index.js",
    dev: [
      "webpack-dev-server/client?http://localhost:3000",
      "webpack/hot/only-dev-server"
    ]
  },
  output: {
    filename: "assets/js/[name].js"
  },
  stats: "minimal",
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new DashboardPlugin()
  ]
};
