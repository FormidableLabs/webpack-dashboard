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
program.option("-t, --title [title]", "Terminal window title");
program.option("-p, --port [port]", "Socket listener port");
program.usage("[options] -- [script] [arguments]");
program.parse(process.argv);

var logFromChild = true;

if (!program.args.length) {
  logFromChild = false;
}

if(logFromChild) {
  var command = program.args[0];
  var args = program.args.slice(1);
  var env = process.env;
  
  env.FORCE_COLOR = true;
  
  var child = spawn(command, args, {
    env: env,
    stdio: [null, null, null, null],
    detached: true
  });
}

var dashboard = new Dashboard({
  color: program.color || "green",
  minimal: program.minimal || false,
  title: program.title || null
});

var port = program.port || 9838;
var server = SocketIO(port);

server.on("error", function(err) {
  console.log(err);
});



if(logFromChild) {
  server.on("connection", function(socket) {
    socket.on("message", function(message) {
      if(message.type !== "log") {
        dashboard.setData(message);
      }
    });
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
} else {
  server.on("connection", function(socket) {
    socket.on("message", function(message) {
      dashboard.setData(message);
    });
  });
}

