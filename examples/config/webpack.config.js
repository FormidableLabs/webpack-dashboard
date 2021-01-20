const { resolve } = require("path");
const { StatsWriterPlugin } = require("webpack-stats-plugin");
const { DuplicatesPlugin } = require("inspectpack/plugin");
const Dashboard = require("../../plugin");
const webpackPkg = require("webpack/package.json");
const webpackVers = webpackPkg.version.split(".")[0];

// Specify the directory of the example we're working with
const cwd = `${process.cwd()}/examples/${process.env.EXAMPLE}`;
if (!process.env.EXAMPLE) {
  throw new Error("EXAMPLE is required");
}

const mode = process.env.WEBPACK_MODE || "development";

module.exports = {
  mode,
  devtool: false,
  context: resolve(cwd),
  entry: {
    bundle: "./src/index.js",
    // Hard-code path to the "hello world" no-dep entry for 2+ asset testing
    hello: "../simple/src/index.js"
  },
  output: {
    path: resolve(cwd, `dist-${mode}-${webpackVers}`),
    pathinfo: true,
    filename: "[name].js"
  },
  plugins: [
    new StatsWriterPlugin({
      fields: ["assets", "modules"],
      stats: {
        source: true // Needed for webpack5+
      }
    }),
    new DuplicatesPlugin({
      verbose: true,
      emitErrors: false
    }),
    new Dashboard({
      // Optionally filter which assets to report on by string prefix or regex.
      // includeAssets: ["bundle", /bund/]
    })
  ]
};
