#!/usr/bin/env node
"use strict";

var commander = require("commander");
var spawn = require('child_process').spawn;
var path = require('path');
var Dashboard = require('../dashboard/index.js');

var program = new commander.Command("webpack-dashboard");

var pkg = require("../package.json");
program.version(pkg.version);
program.usage("[script] [arguments]");
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

  var dashboard = new Dashboard();

  child.on("message", function (data) {
    data.type && dashboard.setData(data);
  });

  child.stdout.on('data', function (data) {
    dashboard.setData({
      type: 'log',
      value: data.toString("utf8")
    });
  });

  child.stderr.on('data', function (data) {
    dashboard.setData({
      type: 'error',
      value: data.toString("utf8")
    });
  });

} catch (e) {
  throw new Error(e);
}

process.on('exit', function () {
  child.kill();
});
