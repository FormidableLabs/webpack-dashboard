"use strict";

const webpack = require("webpack");
const SocketIOClient = require("socket.io-client");

const DEFAULT_PORT = 9838;
const ONE_SECOND = 1000;

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
      this.port = options.port || DEFAULT_PORT;
      this.handler = options.handler || null;
    }
  }

  apply(compiler) {
    let handler = this.handler;
    let timer;

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
  }
}

module.exports = DashboardPlugin;
