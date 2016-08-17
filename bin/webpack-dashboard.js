#!/usr/bin/env node
"use strict";

var commander = require("commander");
var spawn = require("child_process").spawn;
var Dashboard = require("../dashboard/index.js");
var net = require("net");
var JsonSocket = require("json-socket");

var program = new commander.Command("webpack-dashboard");

var pkg = require("../package.json");
program.version(pkg.version);
program.option('-c, --color [color]', 'Dashboard color');
program.option('-p, --port [port]', 'Socket listener port');
program.usage("[options] -- [script] [arguments]");
program.parse(process.argv);

if (!program.args.length) {
  program.outputHelp();
  return;
}

var command = program.args[0];
var args = program.args.slice(1);

try {

  var child = spawn(command, args, {
    stdio: [null, null, null, 'ipc']
  });

  var dashboard = new Dashboard({
    color: program.color || "green"
  });

  var port = program.port || 9838;
  var server = net.createServer();
  server.listen(port);
  server.on('connection', function(socket) {
    socket = new JsonSocket(socket);
    socket.on('message', function(message) {
      dashboard.setData(message);
    });
  });

  server.on('error', function(err) {
    console.log(err);
  });

  child.stdout.on('data', function (data) {
    dashboard.setData([{
      type: 'log',
      value: data.toString("utf8")
    }]);
  });

  child.stderr.on('data', function (data) {
    dashboard.setData([{
      type: 'error',
      value: data.toString("utf8")
    }]);
  });

} catch (e) {
  throw new Error(e);
}

process.on('exit', function () {
  child.kill();
});
