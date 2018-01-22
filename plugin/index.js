/* eslint-disable max-params, max-statements */
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
const DEFAULT_HOST = "127.0.0.1";
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

class DashboardPlugin {
  constructor(options) {
    if (typeof options === "function") {
      this.handler = options;
    } else {
      options = options || {};
      this.host = options.host || DEFAULT_HOST;
      this.port = options.port || DEFAULT_PORT;
      this.root = options.root;
      this.gzip = !(options.gzip === false);
      // `gzip = true` implies `minified = true`.
      this.minified = this.gzip || !(options.minified === false);
      this.handler = options.handler || null;
    }

    this.cleanup = this.cleanup.bind(this);

    this.watching = false;
  }

  cleanup() {
    if (!this.watching && this.socket) {
      this.handler = null;
      this.socket.close();
      if (this.inspectpack) {
        this.inspectpack.terminate();
      }
    }
  }

  apply(compiler) {
    // Lazily created so plugin can be configured without starting the daemon
    this.inspectpack = InspectpackDaemon.create({ cacheFilename });

    let handler = this.handler;
    let timer;

    // Enable pathinfo for inspectpack support
    compiler.options.output.pathinfo = true;

    // Safely get the node env if specified in the webpack config
    const definePlugin = compiler.options.plugins
      .filter(plugin => plugin.constructor.name === "DefinePlugin")[0];
    const nodeEnv = JSON.parse(
      _.getOr("\"development\"")(["definitions", "process.env", "NODE_ENV"])(definePlugin));

    if (!handler) {
      handler = noop;
      const port = this.port;
      const host = this.host;
      this.socket = new SocketIOClient(`http://${host}:${port}`);
      this.socket.on("connect", () => {
        handler = this.socket.emit.bind(this.socket, "message");
        handler([{ type: "nodeEnv", value: nodeEnv }]);
      });
      this.socket.once("mode", args => {
        this.minimal = args.minimal;
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

      if (!this.minimal && nodeEnv !== "production") {
        this.observeBundleMetrics(stats, this.inspectpack).subscribe({
          next: message => handler([message]),
          error: err => {
            console.log("Error from inspectpack:", err); // eslint-disable-line no-console
            this.cleanup();
          },
          complete: this.cleanup
        });
      }
    });
  }

  /**
   * Infer the root of the project, w/ package.json + node_modules.
   *
   * Inspectpack's `version` option needs to know where to start resolving
   * packages from to translate `~/lodash/index.js` to
   * `/ACTUAL/PATH/node_modules/index.js`.
   *
   * In common practice, this is _usually_ `bundle.context`, but sometimes folks
   * will set that to a _different_ directory of assets directly copied in or
   * something.
   *
   * To handle varying scenarios, we resolve the project's root as:
   * 1. Plugin `root` option, if set
   * 2. `bundle.context`, if `package.json` exists
   * 3. `process.cwd()`, if `package.json` exists
   * 4. `null` if nothing else matches
   *
   * @param {Object} bundle Bundle
   * @returns {String|null} Project root path or null
   */
  getProjectRoot(bundle) {
    /*eslint-disable global-require*/
    // Start with plugin option (and don't check it).
    // We **will** allow a bad project root to blow up webpack-dashboard.
    if (this.root) {
      return this.root;
    }

    // Try bundle context.
    try {
      if (bundle.context && require(path.join(bundle.context, "package.json"))) {
        return bundle.context;
      }
    } catch (err) { /* passthrough */ }

    // Try CWD.
    try {
      if (require(path.resolve("package.json"))) {
        return process.cwd();
      }
    } catch (err) { /* passthrough */ }

    // A null will be filtered out, disabling `versions` action.
    return null;
  }

  observeBundleMetrics(stats, inspectpack) {
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
              format: "object",
              minified: this.minified,
              gzip: this.gzip
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
            bundles
              .map(bundle => {
                // Root is only needed for versions and we hit disk to check it.
                // So, only check on actual actions and bail out if not found.
                let root;
                if (action === "versions") {
                  root = this.getProjectRoot(bundle);
                  if (!root) {
                    return null;
                  }
                }

                return inspectpack[action]({
                  code: bundle.source,
                  root,
                  duplicates: true,
                  format: "object",
                  minified: this.minified,
                  gzip: this.gzip
                })
                  .then(metrics => ({
                    path: bundle.path,
                    [action]: metrics
                  }));
              })
              .filter(Boolean) // Filter out incorrect actions.
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
}

module.exports = DashboardPlugin;
