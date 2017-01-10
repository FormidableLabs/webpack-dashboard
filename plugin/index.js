/* eslint-disable */
"use strict";

var webpack = require("webpack");
var net = require("net");
var SocketIOClient = require("socket.io-client");

function noop() {}

function DashboardPlugin(options) {
  if (typeof options === "function") {
    this.handler = options;
  } else {
    options = options || {};
    this.port = options.port || 9838;
    this.handler = options.handler || null;
  }
}

function getTimeMessage(timer) {
  var time = Date.now() - timer;

  if (time >= 1000) {
    time /= 1000;
    time = Math.round(time);
    time += 's';
  } else {
      time += 'ms';
  }

  return ' (' + time + ')';
}

DashboardPlugin.prototype.apply = function(compiler) {
  var handler = this.handler;
  var timer;

  if (!handler) {
    handler = noop;
    var port = this.port;
    var host = "127.0.0.1";
    var socket = SocketIOClient("http://" + host + ":" + port);
    socket.on("connect", function() {
      handler = socket.emit.bind(socket, "message");
    });
  }

  compiler.apply(new webpack.ProgressPlugin(function (percent, msg) {
    handler.call(null, [{
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

  compiler.plugin("compile", function() {
    timer = Date.now();
    handler.call(null, [{
      type: "status",
      value: "Compiling"
    }]);
  });

  compiler.plugin("invalid", function() {
    handler.call(null, [{
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

  compiler.plugin("done", function(stats) {
    handler.call(null, [{
      type: "status",
      value: "Success"
    }, {
      type: "progress",
      value: 0
    }, {
      type: "operations",
      value: "idle" + getTimeMessage(timer)
    }, {
      type: "stats",
      value: {
        errors: stats.hasErrors(),
        warnings: stats.hasWarnings(),
        data: stats.toJson()
      }
    }, {
      type: "log",
      value: stats.toString({colors: true})
    }]);
  });

  compiler.plugin("failed", function() {
    handler.call(null, [{
      type: "status",
      value: "Failed"
    }, {
      type: "operations",
      value: "idle" + getTimeMessage(timer)
    }]);
  });

}

module.exports = DashboardPlugin;
