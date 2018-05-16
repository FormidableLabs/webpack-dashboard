/* eslint-disable max-params, max-statements */
"use strict";
// TODO(IP3): First pass done.

const _ = require("lodash/fp");
const most = require("most");
const webpack = require("webpack");
const SocketIOClient = require("socket.io-client");
const { actions } = require("inspectpack");

const { serializeError } = require("../utils/error-serialization");

const DEFAULT_PORT = 9838;
const DEFAULT_HOST = "127.0.0.1";
const ONE_SECOND = 1000;
const INSPECTPACK_PROBLEM_ACTIONS = ["versions", "duplicates"];
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
    const statsToObserve = statsObj.toJson();

    // TODO(IP3): Separate chunks. (TODO_CHUNKS)
    const getSizes = stats => actions("sizes", { stats })
      .then(instance => instance.getData())
      .then(metrics => ({
        type: "sizes",
        value: [
          {
            path: "TODO_CHUNKS",
            metrics
          }
        ]
      }))
      .catch(err => ({
        type: "sizes",
        error: true,
        value: serializeError(err)
      }));

    // TODO(IP3): Need to filter out "no problems to report".
    const getProblems = stats => Promise
      .all(INSPECTPACK_PROBLEM_ACTIONS.map(action => actions(action, { stats })
        .then(metrics => ({
          path: "TODO_CHUNKS",
          [action]: metrics
        }))
      ))
      .then(allMetrics => ({
        type: INSPECTPACK_PROBLEM_TYPE,
        value: _.flatten(allMetrics)
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
