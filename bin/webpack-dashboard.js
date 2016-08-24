#!/usr/bin/env node
"use strict";

var commander = require("commander");
var spawn = require("cross-spawn");
var Dashboard = require("../dashboard/index.js");
var SocketIO = require("socket.io");

var program = new commander.Command("webpack-dashboard");

var pkg = require("../package.json");
program.version(pkg.version);
program.option("-c, --color [color]", "Dashboard color");
program.option("-m, --minimal", "Minimal mode");
program.option("-p, --port [port]", "Socket listener port");
program.usage("[options] -- [script] [arguments]");
program.parse(process.argv);

if (!program.args.length) {
  program.outputHelp();
  return;
}

var command = program.args[0];
var args = program.args.slice(1);
var env = process.env;

env.FORCE_COLOR = true;

var child = spawn(command, args, {
  env: env,
  stdio: [null, null, null, null],
  detached: true
});

var dashboard = new Dashboard({
  color: program.color || "green",
  minimal: program.minimal || false
});

var port = program.port || 9838;
var server = SocketIO(port);
server.on("connection", function(socket) {
  socket.on("message", function(message) {
    dashboard.setData(message);
  });
});

server.on("error", function(err) {
  console.log(err);
});

child.stdout.on("data", function (data) {
  dashboard.setData([{
    type: "log",
    value: data.toString("utf8")
  }]);
});

child.stderr.on("data", function (data) {
  dashboard.setData([{
    type: "log",
    value: data.toString("utf8")
  }]);
});

process.on("exit", function () {
  process.kill(process.platform === "win32" ? child.pid : -child.pid);
});
