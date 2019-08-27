/* eslint-disable max-params, max-statements */

"use strict";

const most = require("most");
const webpack = require("webpack");
const SocketIOClient = require("socket.io-client");
const inspectpack = require("inspectpack");

const serializer = require("../utils/error-serialization");

const DEFAULT_PORT = 9838;
const DEFAULT_HOST = "127.0.0.1";
const ONE_SECOND = 1000;
const INSPECTPACK_PROBLEM_ACTIONS = ["duplicates", "versions"];
const INSPECTPACK_PROBLEM_TYPE = "problems";

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

// Naive camel-casing.
const camel = str => str.replace(/-([a-z])/, group => group[1].toUpperCase());

// Normalize webpack3 vs. 4 API differences.
function _webpackHook(hookType, compiler, event, callback) {
  if (compiler.hooks) {
    hookType = hookType || "tap";
    compiler.hooks[camel(event)][hookType]("webpack-dashboard", callback);
  } else {
    compiler.plugin(event, callback);
  }
}

const webpackHook = _webpackHook.bind(null, "tap");
const webpackAsyncHook = _webpackHook.bind(null, "tapAsync");

class DashboardPlugin {
  constructor(options) {
    if (typeof options === "function") {
      this.handler = options;
    } else {
      options = options || {};
      this.host = options.host || DEFAULT_HOST;
      this.port = options.port || DEFAULT_PORT;
      this.includeAssets = options.includeAssets || [];
      this.handler = options.handler || null;
    }

    this.cleanup = this.cleanup.bind(this);

    this.watching = false;
  }

  cleanup() {
    if (!this.watching && this.socket) {
      this.handler = null;
      this.socket.close();
    }
  }

  apply(compiler) {
    let handler = this.handler;
    let reachedSuccess = false;
    let timer;

    if (!handler) {
      handler = noop;
      const port = this.port;
      const host = this.host;
      this.socket = new SocketIOClient(`http://${host}:${port}`);
      this.socket.on("connect", () => {
        handler = this.socket.emit.bind(this.socket, "message");
      });
      this.socket.once("options", args => {
        this.minimal = args.minimal;
        this.includeAssets = this.includeAssets.concat(args.includeAssets || []);
      });
      this.socket.on("error", err => {
        // eslint-disable-next-line no-console
        console.log(err);
      });
      this.socket.on("disconnect", () => {
        if (!reachedSuccess) {
          // eslint-disable-next-line no-console
          console.log("Socket.io disconnected before completing build lifecycle.");
        }
      });
    }

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
    }).apply(compiler);

    webpackAsyncHook(compiler, "watch-run", (c, done) => {
      this.watching = true;
      done();
    });

    webpackAsyncHook(compiler, "run", (c, done) => {
      this.watching = false;
      done();
    });

    webpackHook(compiler, "compile", () => {
      timer = Date.now();
      handler([
        {
          type: "status",
          value: "Compiling"
        }
      ]);
    });

    webpackHook(compiler, "invalid", () => {
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

    webpackHook(compiler, "failed", () => {
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

    webpackHook(compiler, "done", stats => {
      const options = stats.compilation.options;
      const statsOptions = (options.devServer && options.devServer.stats) ||
        options.stats || { colors: true };

      // We only need errors/warnings for stats information for finishing up.
      // This allows us to avoid sending a full stats object to the CLI which
      // can cause socket.io client disconnects for large objects.
      // See: https://github.com/FormidableLabs/webpack-dashboard/issues/279
      const statsJsonOptions = {
        all: false,
        errors: true,
        warnings: true
      };

      handler(
        [
          {
            type: "status",
            value: "Success"
          },
          {
            type: "progress",
            value: 1
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
              data: stats.toJson(statsJsonOptions)
            }
          },
          {
            type: "log",
            value: stats.toString(statsOptions)
          }
        ],
        () => {
          reachedSuccess = true;
        }
      );

      if (!this.minimal) {
        this.observeMetrics(stats).subscribe({
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

  observeMetrics(statsObj) {
    // Get the **full** stats object here for `inspectpack` analysis.
    const statsToObserve = statsObj.toJson();

    // Truncate off non-included assets.
    const { includeAssets } = this;
    if (includeAssets.length) {
      statsToObserve.assets = statsToObserve.assets.filter(({ name }) =>
        includeAssets.some(pattern => {
          if (typeof pattern === "string") {
            return name.startsWith(pattern);
          } else if (pattern instanceof RegExp) {
            return pattern.test(name);
          }

          // Pass through bad options..
          return false;
        })
      );
    }

    // Late destructure so that we can stub.
    const { actions } = inspectpack;
    const { serializeError } = serializer;

    const getSizes = stats =>
      actions("sizes", { stats })
        .then(instance => instance.getData())
        .then(data => ({
          type: "sizes",
          value: data
        }))
        .catch(err => ({
          type: "sizes",
          error: true,
          value: serializeError(err)
        }));

    const getProblems = stats =>
      Promise.all(
        INSPECTPACK_PROBLEM_ACTIONS.map(action =>
          actions(action, { stats }).then(instance => instance.getData())
        )
      )
        .then(datas => ({
          type: INSPECTPACK_PROBLEM_TYPE,
          value: INSPECTPACK_PROBLEM_ACTIONS.reduce(
            (memo, action, i) =>
              Object.assign({}, memo, {
                [action]: datas[i]
              }),
            {}
          )
        }))
        .catch(err => ({
          type: INSPECTPACK_PROBLEM_TYPE,
          error: true,
          value: serializeError(err)
        }));

    const sizesStream = most.of(statsToObserve).map(getSizes);
    const problemsStream = most.of(statsToObserve).map(getProblems);

    return most.mergeArray([sizesStream, problemsStream]).chain(most.fromPromise);
  }
}

module.exports = DashboardPlugin;
