"use strict";

const fs = require("fs");
const path = require("path");
const fork = require("child_process").fork;

const inspectpackServerPath = path.resolve(__dirname, "inspectpack-server");

function debug(text) {
  fs.appendFileSync("/Users/admin/Documents/shitness", JSON.stringify(text));
}

module.exports = class InspectpackClient {
  constructor(callbacks) {
    this._child = fork(
      inspectpackServerPath,
      [],
      {
        // Prevent debugger port clashes
        execArgv: ["--inspect=8999"]
      }
    );

    if (callbacks.onError) {
      this._child.on("error", callbacks.onError);
    }

    if (callbacks.onClose) {
      this._child.on("close", callbacks.onClose);
    }

    this._child.on("message", message => {
      debug(message);
      switch (message.type) {
      case "RECEIVE_SIZES":
        if (callbacks.onSizes) {
          callbacks.onSizes(message.payload);
        }
        break;
      }
    });
  }

  requestSizes(bundles) {
    this._child.send({
      type: "REQUEST_SIZES",
      payload: bundles
    });
  }
};
