/* eslint-disable */
"use strict";

var webpack = require("webpack");

function noop() {}

function DashboardPlugin(options) {
  if (typeof options === "function") {
		options = {
			handler: options
		};
	}
	options = options || {};
  this.handler = options.handler;
}

DashboardPlugin.prototype.apply = function(compiler) {
  var handler = this.handler || noop;

  compiler.apply(new webpack.ProgressPlugin(function (percent, msg) {
    handler.call(null, {
      type: "progress",
      value: percent
    });
    handler.call(null, {
      type: "operations",
      value: msg
    });
  }));

  compiler.plugin("compile", function() {
    handler.call(null, {
      type: "status",
      value: "Compiling"
    });
  });

  compiler.plugin("invalid", function() {
    handler.call(null, {
      type: "status",
      value: "Invalidated"
    });
    handler.call(null, {
      type: "progress",
      value: 0
    });
    handler.call(null, {
      type: "operations",
      value: "idle"
    });
  });

  compiler.plugin("done", function(stats) {
    handler.call(null, {
      type: "status",
      value: "Success"
    });
    handler.call(null, {
      type: "stats",
      value: stats
    });
    handler.call(null, {
      type: "progress",
      value: 0
    });
    handler.call(null, {
      type: "operations",
      value: "idle"
    });
  });

  compiler.plugin("failed", function() {
    handler.call(null, {
      type: "status",
      value: "Failed"
    });
    handler.call(null, {
      type: "operations",
      value: "idle"
    });
  });

}

module.exports = DashboardPlugin;
