"use strict";

const _ = require("lodash/fp");
const os = require("os");
const path = require("path");
const webpack = require("webpack");
const SocketIOClient = require("socket.io-client");
const InspectpackDaemon = require("inspectpack").daemon;

const serializeError = require("../utils/error-serialization").serializeError;

const DEFAULT_PORT = 9838;
const ONE_SECOND = 1000;
const INSPECTPACK_INDEPENDENT_ACTIONS = ["sizes"];
const INSPECTPACK_PROBLEM_ACTIONS = ["versions", "duplicates"];
const INSPECTPACK_PROBLEM_TYPE = "problems";

const cacheDir = path.resolve(
  os.homedir(),
  ".webpack-dashboard-cache"
);

function noop() {}

function getTimeMessage(timer) {
  let time = Date.now() - timer;

  if (time >= ONE_SECOND) {
    time /= ONE_SECOND;
    time = Math.round(time);
    time += "s";
  } else {
    time += "ms";
  }

  return ` (${time})`;
}

function getBundleMetrics(stats, inspectpack, handler) {
  const bundles = Object.keys(stats.compilation.assets)
    .filter(bundlePath =>
      // Don't include hot reload assets, they break everything
      // and the updates are already included in the new assets
      bundlePath.indexOf(".hot-update.") === -1 &&

      // Don't parse sourcemaps!
      path.extname(bundlePath) === ".js"
    )
    .map(bundlePath => ({
      path: bundlePath,
      context: stats.compilation.options.context,
      source: stats.compilation.assets[bundlePath].source()
    }));

  INSPECTPACK_INDEPENDENT_ACTIONS.forEach(action => {
    Promise.all(bundles.map(bundle =>
      inspectpack[action]({
        code: bundle.source,
        root: bundle.context,
        format: "object",
        minified: true,
        gzip: true
      })
        .then(metrics => ({
          path: bundle.path,
          metrics
        }))
    ))
      .then(bundle => handler([{
        type: action,
        value: bundle
      }]))
      .catch(err => handler([{
        type: action,
        error: true,
        value: serializeError(err)
      }]));
  });

  Promise.all(INSPECTPACK_PROBLEM_ACTIONS.map(action =>
    Promise.all(bundles.map(bundle =>
      inspectpack[action]({
        code: bundle.source,
        root: bundle.context,
        duplicates: true,
        format: "object",
        minified: true,
        gzip: true
      })
        .then(metrics => ({
          path: bundle.path,
          [action]: metrics
        }))
    ))
  ))
    .then(bundle =>
      handler([{
        type: INSPECTPACK_PROBLEM_TYPE,
        value: _.flatten(bundle)
      }])
    )
    .catch(err =>
      handler([{
        type: INSPECTPACK_PROBLEM_TYPE,
        error: true,
        value: serializeError(err)
      }])
    );
}

class DashboardPlugin {
  constructor(options) {
    if (typeof options === "function") {
      this.handler = options;
    } else {
      options = options || {};
      this.port = options.port || DEFAULT_PORT;
      this.handler = options.handler || null;
    }
  }

  apply(compiler) {
    let handler = this.handler;
    let timer;

    // Enable pathinfo for inspectpack support
    compiler.options.output.pathinfo = true;

    if (!handler) {
      handler = noop;
      const port = this.port;
      const host = "127.0.0.1";
      const socket = new SocketIOClient(`http://${host}:${port}`);
      socket.on("connect", () => {
        handler = socket.emit.bind(socket, "message");
      });
    }

    compiler.apply(new webpack.ProgressPlugin((percent, msg) => {
      handler([{
        type: "status",
        value: "Compiling"
      }, {
        type: "progress",
        value: percent
      }, {
        type: "operations",
        value: msg + getTimeMessage(timer)
      }]);
    }));

    compiler.plugin("watch-run", (c, done) => {
      InspectpackDaemon.init({ cacheDir }).then(inspectpack => {
        this.inspectpack = inspectpack;
        done();
      });
    });

    compiler.plugin("compile", () => {
      timer = Date.now();
      handler([{
        type: "status",
        value: "Compiling"
      }]);
    });

    compiler.plugin("invalid", () => {
      handler([{
        type: "status",
        value: "Invalidated"
      }, {
        type: "progress",
        value: 0
      }, {
        type: "operations",
        value: "idle"
      }, {
        type: "clear"
      }]);
    });

    compiler.plugin("failed", () => {
      handler([{
        type: "status",
        value: "Failed"
      }, {
        type: "operations",
        value: `idle${getTimeMessage(timer)}`
      }]);
    });

    compiler.plugin("done", stats => {
      const options = stats.compilation.options;
      const statsOptions =
        options.devServer && options.devServer.stats
          || options.stats
          || { colors: true };

      handler([{
        type: "status",
        value: "Success"
      }, {
        type: "progress",
        value: 0
      }, {
        type: "operations",
        value: `idle${getTimeMessage(timer)}`
      }, {
        type: "stats",
        value: {
          errors: stats.hasErrors(),
          warnings: stats.hasWarnings(),
          data: stats.toJson()
        }
      }, {
        type: "log",
        value: stats.toString(statsOptions)
      }]);

      getBundleMetrics(stats, this.inspectpack, handler);
    });
  }
}

module.exports = DashboardPlugin;
