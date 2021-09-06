#!/usr/bin/env node

"use strict";

const commander = require("commander");
const spawn = require("cross-spawn");
const Dashboard = require("../dashboard/index");
const io = require("socket.io");

const DEFAULT_PORT = 9838;

const pkg = require("../package.json");

const collect = (val, prev) => prev.concat([val]);

// Wrap up side effects in a script.
// eslint-disable-next-line max-statements, complexity
const main = opts => {
  opts = opts || {};
  const argv = typeof opts.argv === "undefined" ? process.argv : opts.argv;
  const isWindows = process.platform === "win32";

  const program = new commander.Command("webpack-dashboard")
    .version(pkg.version)
    .option("-c, --color [color]", "Dashboard color")
    .option("-m, --minimal", "Minimal mode")
    .option("-t, --title [title]", "Terminal window title")
    .option("-p, --port [port]", "Socket listener port")
    .option("-a, --include-assets [string prefix]", "Asset names to limit to", collect, [])
    .usage("[options] -- [script] [arguments]")
    .parse(argv);

  const cliOpts = program.opts();
  const cliArgs = program.args;

  let logFromChild = true;
  let child;

  if (!cliArgs.length) {
    logFromChild = false;
  }

  if (logFromChild) {
    const command = cliArgs[0];
    const args = cliArgs.slice(1);
    const env = process.env;

    env.FORCE_COLOR = true;

    child = spawn(command, args, {
      env,
      stdio: [null, null, null, null],
      detached: !isWindows
    });
  }

  const dashboard = new Dashboard({
    color: cliOpts.color || "green",
    minimal: cliOpts.minimal || false,
    title: cliOpts.title || null
  });

  const port = parseInt(cliOpts.port || DEFAULT_PORT, 10);
  const server = opts.server || io(port);

  server.on("error", err => {
    // eslint-disable-next-line no-console
    console.log(err);
  });

  if (logFromChild) {
    server.on("connection", socket => {
      socket.emit("options", {
        minimal: cliOpts.minimal || false,
        includeAssets: cliOpts.includeAssets || []
      });

      socket.on("message", (message, ack) => {
        // Note: `message` may be null.
        // https://github.com/FormidableLabs/webpack-dashboard/issues/335
        if (message && message.type !== "log") {
          dashboard.setData(message, ack);
        }
      });
    });

    child.stdout.on("data", data => {
      dashboard.setData([
        {
          type: "log",
          value: data.toString("utf8")
        }
      ]);
    });

    child.stderr.on("data", data => {
      dashboard.setData([
        {
          type: "log",
          value: data.toString("utf8")
        }
      ]);
    });

    process.on("exit", () => {
      process.kill(isWindows ? child.pid : -child.pid);
    });
  } else {
    server.on("connection", socket => {
      socket.on("message", (message, ack) => {
        dashboard.setData(message, ack);
      });
    });
  }
};

if (require.main === module) {
  main();
}

module.exports = main;
