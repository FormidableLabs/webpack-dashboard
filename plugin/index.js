/* eslint-disable max-params, max-statements */

"use strict";

const webpack = require("webpack");
const io = require("socket.io-client");
const inspectpack = require("inspectpack");

const serializer = require("../utils/error-serialization");

const DEFAULT_PORT = 9838;
const DEFAULT_HOST = "127.0.0.1";
const ONE_SECOND = 1000;
const INSPECTPACK_PROBLEM_ACTIONS = ["duplicates", "versions"];
const INSPECTPACK_PROBLEM_TYPE = "problems";
const CLEANUP_MAX_NUM_TRIES = 3; // Try 3 times to close before giving up.
const CLEANUP_RETRY_DELAY_MS = 100; // Delay before a retry.

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
      this._handler = options;
    } else {
      options = options || {};
      this.host = options.host || DEFAULT_HOST;
      this.port = options.port || DEFAULT_PORT;
      this.includeAssets = options.includeAssets || [];
      this._handler = options.handler || null;
    }

    this.watching = false;
    this.openMessages = 0;
  }

  handler(...args) {
    if (this._handler) {
      this._handler(...args);
    }
  }

  cleanup(numTried = 0) {
    if (!this._cleanedUp && !this.watching && this.socket) {
      // Clear handler so we don't emit any more messages.
      this._handler = null;

      // Check if we have unhandled dashboard messages.
      if (this.openMessages > 0 && numTried < CLEANUP_MAX_NUM_TRIES) {
        // Wait a small interval and try again, up to a maximum.
        setTimeout(() => this.cleanup(numTried++), CLEANUP_RETRY_DELAY_MS);
        return;
      }

      // Close!
      this._cleanedUp = true;
      this.socket.close();
    }
  }

  apply(compiler) {
    // Reached compile "done" state.
    let reachedDone = false;
    // Compile has finished in "done", "error", "failed" states.
    let finished = false;
    let timer;

    if (!this._handler) {
      this._handler = noop;
      const port = this.port;
      const host = this.host;
      this.socket = io(`http://${host}:${port}`);
      this.socket.on("connect", () => {
        // Manually track messages we send to the dashboard and decrement later.
        const socketMsg = this.socket.emit.bind(this.socket, "message");
        const ack = () => {
          this.openMessages--;
        };
        this._handler = (...args) => {
          this.openMessages++;
          socketMsg(...args, ack);
        };
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
        if (!reachedDone) {
          // eslint-disable-next-line no-console
          console.log("Socket.io disconnected before completing build lifecycle.");
        }
      });
    }

    new webpack.ProgressPlugin((percent, msg) => {
      // Skip reporting once finished.
      if (finished) {
        return;
      }

      this.handler([
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
      finished = false;
      this.handler([
        {
          type: "status",
          value: "Compiling"
        }
      ]);
    });

    webpackHook(compiler, "invalid", () => {
      finished = true;
      this.handler([
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
      finished = true;
      this.handler([
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

    webpackAsyncHook(compiler, "done", (stats, done) => {
      const { errors, options } = stats.compilation;
      const statsOptions = (options.devServer && options.devServer.stats) ||
        options.stats || { colors: true };
      const status = errors.length ? "Error" : "Success";

      // We only need errors/warnings for stats information for finishing up.
      // This allows us to avoid sending a full stats object to the CLI which
      // can cause socket.io client disconnects for large objects.
      // See: https://github.com/FormidableLabs/webpack-dashboard/issues/279
      const statsJsonOptions = {
        all: false,
        errors: true,
        warnings: true
      };

      reachedDone = true;
      finished = true;
      this.handler([
        {
          type: "status",
          value: status
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
      ]);

      // Skip metrics in minimal mode.
      const getMetrics = () => (this.minimal ? Promise.resolve() : this.getMetrics(stats));

      // eslint-disable-next-line promise/catch-or-return
      getMetrics()
        .then(datas => this.handler(datas))
        .catch(err => {
          console.log("Error from inspectpack:", err); // eslint-disable-line no-console
        })
        // eslint-disable-next-line promise/always-return
        .then(() => {
          this.cleanup();
          done(); // eslint-disable-line promise/no-callback-in-promise
        });
    });
  }

  getMetrics(statsObj) {
    // Get the **full** stats object here for `inspectpack` analysis.
    const stats = statsObj.toJson({
      source: true // Needed for webpack5+
    });

    // Truncate off non-included assets.
    const { includeAssets } = this;
    if (includeAssets.length) {
      stats.assets = stats.assets.filter(({ name }) =>
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

    const getSizes = () =>
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

    const getProblems = () =>
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

    return Promise.all([getSizes(), getProblems()]);
  }
}

module.exports = DashboardPlugin;
