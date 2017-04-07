#!/usr/bin/env node
"use strict";

const commander = require("commander");
const spawn = require("cross-spawn");
const Dashboard = require("../dashboard/index.js");
const SocketIO = require("socket.io");

const DEFAULT_PORT = 9838;

const program = new commander.Command("webpack-dashboard");

const pkg = require("../package.json");
program.version(pkg.version);
program.option("-c, --color [color]", "Dashboard color");
program.option("-m, --minimal", "Minimal mode");
program.option("-t, --title [title]", "Terminal window title");
program.option("-p, --port [port]", "Socket listener port");
program.usage("[options] -- [script] [arguments]");
program.parse(process.argv);

let logFromChild = true;
let child;

if (!program.args.length) {
  logFromChild = false;
}

if (logFromChild) {
  const command = program.args[0];
  const args = program.args.slice(1);
  const env = process.env;

  env.FORCE_COLOR = true;

  child = spawn(command, args, {
    env,
    stdio: [null, null, null, null],
    detached: true
  });
}

const dashboard = new Dashboard({
  color: program.color || "green",
  minimal: program.minimal || false,
  title: program.title || null
});

const port = program.port || DEFAULT_PORT;
const server = new SocketIO(port);

server.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.log(err);
});

if (logFromChild) {
  server.on("connection", (socket) => {
    socket.on("message", (message) => {
      if (message.type !== "log") {
        dashboard.setData(message);
      }
    });
  });

  child.stdout.on("data", (data) => {
    dashboard.setData([{
      type: "log",
      value: data.toString("utf8")
    }]);
  });

  child.stderr.on("data", (data) => {
    dashboard.setData([{
      type: "log",
      value: data.toString("utf8")
    }]);
  });

  process.on("exit", () => {
    try {
      process.kill(process.platform === "win32" ? child.pid : -child.pid);
    } catch (e) {} // eslint-disable-line no-empty
  });
} else {
  server.on("connection", (socket) => {
    socket.on("message", (message) => {
      dashboard.setData(message);
    });
  });
}
