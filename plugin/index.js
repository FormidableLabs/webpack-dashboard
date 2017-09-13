/* eslint-disable max-params, no-unexpected-multiline, no-console, max-statements */
"use strict";

const _ = require("lodash/fp");
const os = require("os");
const path = require("path");
const most = require("most");
const webpack = require("webpack");
const SocketIOClient = require("socket.io-client");
const InspectpackDaemon = require("inspectpack").daemon;

const serializeError = require("../utils/error-serialization").serializeError;

const DEFAULT_PORT = 9838;
const DEFAULT_HOST = '127.0.0.1';
const ONE_SECOND = 1000;
const INSPECTPACK_PROBLEM_ACTIONS = ["versions", "duplicates"];
const INSPECTPACK_PROBLEM_TYPE = "problems";

const cacheFilename = path.resolve(os.homedir(), ".webpack-dashboard-cache.db");

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

function observeBundleMetrics(stats, inspectpack) {
  const bundlesToObserve = Object.keys(stats.compilation.assets)
    .filter(
      bundlePath =>
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

  const getSizes = bundles =>
    Promise.all(
      bundles.map(bundle =>
        inspectpack
          .sizes({
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
      )
    )
      .then(bundle => ({
        type: "sizes",
        value: bundle
      }))
      .catch(err => ({
        type: "sizes",
        error: true,
        value: serializeError(err)
      }));

  const getProblems = bundles =>
    Promise.all(
      INSPECTPACK_PROBLEM_ACTIONS.map(action =>
        Promise.all(
          bundles.map(bundle =>
            inspectpack
              [action]({
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
          )
        )
      )
    )
      .then(bundle => ({
        type: INSPECTPACK_PROBLEM_TYPE,
        value: _.flatten(bundle)
      }))
      .catch(err => ({
        type: INSPECTPACK_PROBLEM_TYPE,
        error: true,
        value: serializeError(err)
      }));

  const sizesStream = most.of(bundlesToObserve).map(getSizes);
  const problemsStream = most.of(bundlesToObserve).map(getProblems);

  return most.mergeArray([sizesStream, problemsStream]).chain(most.fromPromise);
}

class DashboardPlugin {
  constructor(options) {
    if (typeof options === "function") {
      this.handler = options;
    } else {
      options = options || {};
      this.port = options.port || DEFAULT_PORT;
      this.host = options.host || DEFAULT_HOST;
      this.handler = options.handler || null;
    }

    this.cleanup = this.cleanup.bind(this);

    this.inspectpack = InspectpackDaemon.create({ cacheFilename });
    console.log(this.inspectpack);
    this.watching = false;
  }

  cleanup() {
    if (!this.watching && this.socket) {
      this.handler = null;
      this.socket.close();
      this.inspectpack.terminate();
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
      const host = this.host;
      this.socket = new SocketIOClient(`http://${host}:${port}`);
      this.socket.on("connect", () => {
        handler = this.socket.emit.bind(this.socket, "message");
      });
    }

    compiler.apply(
      new webpack.ProgressPlugin((percent, msg) => {
        handler([
          {
            type: "status",
            value: "Compiling"
          },
          {
            type: "progress",
            value: percent
          },
          {
            type: "operations",
            value: msg + getTimeMessage(timer)
          }
        ]);
      })
    );

    compiler.plugin("watch-run", (c, done) => {
      this.watching = true;
      done();
    });

    compiler.plugin("run", (c, done) => {
      this.watching = false;
      done();
    });

    compiler.plugin("compile", () => {
      timer = Date.now();
      handler([
        {
          type: "status",
          value: "Compiling"
        }
      ]);
    });

    compiler.plugin("invalid", () => {
      handler([
        {
          type: "status",
          value: "Invalidated"
        },
        {
          type: "progress",
          value: 0
        },
        {
          type: "operations",
          value: "idle"
        },
        {
          type: "clear"
        }
      ]);
    });

    compiler.plugin("failed", () => {
      handler([
        {
          type: "status",
          value: "Failed"
        },
        {
          type: "operations",
          value: `idle${getTimeMessage(timer)}`
        }
      ]);
    });

    compiler.plugin("done", stats => {
      const options = stats.compilation.options;
      const statsOptions =
        options.devServer && options.devServer.stats ||
        options.stats ||
        { colors: true };

      handler([
        {
          type: "status",
          value: "Success"
        },
        {
          type: "progress",
          value: 0
        },
        {
          type: "operations",
          value: `idle${getTimeMessage(timer)}`
        },
        {
          type: "stats",
          value: {
            errors: stats.hasErrors(),
            warnings: stats.hasWarnings(),
            data: stats.toJson()
          }
        },
        {
          type: "log",
          value: stats.toString(statsOptions)
        }
      ]);

      observeBundleMetrics(stats, this.inspectpack).subscribe({
        next: message => handler([message]),
        error: err => {
          console.log("Error from inspectpack:", err);
          this.cleanup();
        },
        complete: this.cleanup
      });
    });
  }
}

module.exports = DashboardPlugin;
