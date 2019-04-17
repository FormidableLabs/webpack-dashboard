/* eslint-disable max-params, max-statements */

"use strict";

const most = require("most");
const webpack = require("webpack");
const SocketIOClient = require("socket.io-client");
const { actions } = require("inspectpack");

const { serializeError } = require("../utils/error-serialization");

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
    let timer;

    if (!handler) {
      handler = noop;
      const port = this.port;
      const host = this.host;
      this.socket = new SocketIOClient(`http://${host}:${port}`);
      this.socket.on("connect", () => {
        handler = this.socket.emit.bind(this.socket, "message");
      });
      this.socket.once("mode", args => {
        this.minimal = args.minimal;
      });
      this.socket.on("error", err => {
        // eslint-disable-next-line no-console
        console.log(err);
      });
      this.socket.on("disconnect", () => {
        // eslint-disable-next-line no-console
        console.log("Socket.io disconnected. Possibly build data too large?");
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
      const statsJsonOptions = {
        all: false,
        errors: true,
        warnings: true,
      };

      // TODO(socketio-bug): Remove all temp code here.
      // https://github.com/FormidableLabs/webpack-dashboard/issues/279
      const statsObj = stats.toJson(statsJsonOptions);
      try {
        if (process.env.TMP_BIG_STATS === "true") {
          console.log("TODO REMOVE STATS KEYS", Object.keys(statsObj));
          const firstSourceMod = (statsObj.modules || []).filter(mod => !!mod.source)[0];
          if (firstSourceMod) {
            // Get starting size of stats object and our extra stuff to augment.
            const startingSize = JSON.stringify(statsObj).length + 7;

            // Find the first source module and patch it with a _huge_ string.
            // This value will likely fail on most machines.
            const largeStringSize = 115915534; // From issue 279. Definitely hits it.

            // Experimentally observed on one machine.
            const experimentalSizeSucceeds = 99998786;
            const experimentalSizeFails = 99998787;

            // Choose a size.
            const pad = largeStringSize;
            firstSourceMod.source += `\n// ${"".padEnd(pad - startingSize, "*")}\n`;
          }
        }
      } catch (err) {
        console.error(err);
      }

      handler([
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
            data: statsObj // TODO: UNWIND
          }
        },
        {
          type: "log",
          value: stats.toString(statsOptions)
        }
      ]);

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
