"use strict";

const path = require("path");
const fs = require("fs");
const os = require("os");

const chalk = require("chalk");
const blessed = require("blessed");
const InspectpackDaemon = require("inspectpack").daemon;

const formatOutput = require("../utils/format-output.js");
const formatModules = require("../utils/format-modules.js");
const formatAssets = require("../utils/format-assets.js");

const PERCENT_MULTIPLIER = 100;

class Dashboard {
  static init(options) {
    return InspectpackDaemon.init({
      cacheDir: path.resolve(
        os.homedir(),
        ".webpack-dashboard-cache"
      )
    }).then(
      inspectpack => new Dashboard(inspectpack, options)
    );
  }

  constructor(inspectpack, options) {
    const title = options && options.title || "webpack-dashboard";

    this.inspectpack = inspectpack;

    this.color = options && options.color || "green";
    this.minimal = options && options.minimal || false;
    this.setData = this.setData.bind(this);

    this.stats = null;

    this.screen = blessed.screen({
      title,
      smartCSR: true,
      dockBorders: false,
      fullUnicode: true,
      autoPadding: true
    });

    this.layoutLog();
    this.layoutStatus();
    if (!this.minimal) {
      this.layoutModules();
      this.layoutAssets();
    }

    this.screen.key(["escape", "q", "C-c"], () => {
      // eslint-disable-next-line no-process-exit
      process.exit(0);
    });

    this.screen.render();
  }

  setData(dataArray) {
    dataArray.forEach(data => {
      switch (data.type) {
      case "progress":
        this.setProgress(data);
        break;

      case "operations":
        this.setOperations(data);
        break;

      case "status":
        this.setStatus(data);
        break;

      case "stats":
        this.setStats(data);
        break;

      case "log":
        this.setLog(data);
        break;

      case "clear":
        this.clear();
        break;
      }
    });

    this.screen.render();
  }

  setProgress(data) {
    const percent = parseInt(data.value * PERCENT_MULTIPLIER);
    const formattedPercent = `${percent.toString()}%`;

    if (!percent) {
      this.progressbar.setProgress(percent);
    }

    if (this.minimal) {
      this.progress.setContent(formattedPercent);
    } else {
      this.progressbar.setContent(formattedPercent);
      this.progressbar.setProgress(percent);
    }
  }

  setOperations(data) {
    this.operations.setContent(data.value);
  }

  setStatus(data) {
    let content;

    switch (data.value) {
    case "Success":
      content = `{green-fg}{bold}${data.value}{/}`;
      break;
    case "Failed":
      content = `{red-fg}{bold}${data.value}{/}`;
      break;
    default:
      content = `{bold}${data.value}{/}`;
    }
    this.status.setContent(content);
  }

  setStats(data) {
    const stats = {
      hasErrors: () => {
        return data.value.errors;
      },
      hasWarnings: () => {
        return data.value.warnings;
      },
      toJson: () => {
        return data.value.data;
      }
    };

    // Save for later when merging inspectpack sizes into the asset list
    this.stats = stats;

    if (stats.hasErrors()) {
      this.status.setContent("{red-fg}{bold}Failed{/}");
    }

    this.logText.log(formatOutput(stats));

    if (!this.minimal) {
      this.modules.setLabel(chalk.yellow("Modules (loading...)"));
      this.assets.setLabel(chalk.yellow("Assets (loading...)"));
      Promise.all(data.value.data.bundleSources.map(bundle =>
        this.inspectpack.sizes({
          code: bundle.source,
          format: "object",
          minified: true,
          gzip: true
        })
          .then(metrics => ({
            path: bundle.path,
            metrics
          }))
      ))
        .then(this.setSizes.bind(this))
        .catch(this.setSizesError.bind(this));
    }
  }

  setSizes(bundles) {
    this.modules.setLabel("Modules");
    this.assets.setLabel("Assets");
    this.moduleTable.setData(formatModules(bundles));
    this.assetTable.setData(formatAssets(this.stats, bundles));

    this.screen.render();
  }

  setSizesError(err) {
    this.modules.setLabel(chalk.red("Modules (error)"));
    this.assets.setLabel(chalk.red("Assets (error)"));
    this.logText.log(chalk.red("Could not load module/asset sizes."));
    this.logText.log(chalk.red(err));
  }

  setLog(data) {
    this.logText.log(data.value.replace(/[{}]/g, ""));
  }

  clear() {
    this.logText.setContent("");
  }

  layoutLog() {
    this.log = blessed.box({
      label: "Log",
      padding: 1,
      width: this.minimal ? "100%" : "75%",
      height: this.minimal ? "70%" : "42%",
      left: "0%",
      top: "0%",
      border: {
        type: "line"
      },
      style: {
        fg: -1,
        border: {
          fg: this.color
        }
      }
    });

    this.logText = blessed.log({
      parent: this.log,
      tags: true,
      width: "100%-5",
      scrollable: true,
      input: true,
      alwaysScroll: true,
      scrollbar: {
        ch: " ",
        inverse: true
      },
      keys: true,
      vi: true,
      mouse: true
    });

    this.screen.append(this.log);
  }

  layoutModules() {
    this.modules = blessed.box({
      label: "Modules",
      tags: true,
      padding: 1,
      width: "50%",
      height: "58%",
      left: "0%",
      top: "42%",
      border: {
        type: "line"
      },
      style: {
        fg: -1,
        border: {
          fg: this.color
        }
      }
    });

    this.moduleTable = blessed.table({
      parent: this.modules,
      height: "100%",
      width: "100%-5",
      align: "left",
      pad: 1,
      shrink: true,
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: " ",
        inverse: true
      },
      keys: true,
      vi: true,
      mouse: true,
      data: [["Name", "Size (min+gz)", "Percentage"]]
    });

    this.screen.append(this.modules);
  }

  layoutAssets() {
    this.assets = blessed.box({
      label: "Assets",
      tags: true,
      padding: 1,
      width: "50%",
      height: "58%",
      left: "50%",
      top: "42%",
      border: {
        type: "line"
      },
      style: {
        fg: -1,
        border: {
          fg: this.color
        }
      }
    });

    this.assetTable = blessed.table({
      parent: this.assets,
      height: "100%",
      width: "100%-5",
      align: "left",
      pad: 1,
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: " ",
        inverse: true
      },
      keys: true,
      vi: true,
      mouse: true,
      data: [["Name", "Size"]]
    });

    this.screen.append(this.assets);
  }

  // eslint-disable-next-line complexity
  layoutStatus() {
    this.wrapper = blessed.layout({
      width: this.minimal ? "100%" : "25%",
      height: this.minimal ? "30%" : "42%",
      top: this.minimal ? "70%" : "0%",
      left: this.minimal ? "0%" : "75%",
      layout: "grid"
    });

    this.status = blessed.box({
      parent: this.wrapper,
      label: "Status",
      tags: true,
      padding: {
        left: 1
      },
      width: this.minimal ? "34%" : "100%",
      height: this.minimal ? "100%" : "34%",
      valign: "middle",
      border: {
        type: "line"
      },
      style: {
        fg: -1,
        border: {
          fg: this.color
        }
      }
    });

    this.operations = blessed.box({
      parent: this.wrapper,
      label: "Operation",
      tags: true,
      padding: {
        left: 1
      },
      width: this.minimal ? "34%" : "100%",
      height: this.minimal ? "100%" : "34%",
      valign: "middle",
      border: {
        type: "line"
      },
      style: {
        fg: -1,
        border: {
          fg: this.color
        }
      }
    });

    this.progress = blessed.box({
      parent: this.wrapper,
      label: "Progress",
      tags: true,
      padding: this.minimal ? {
        left: 1
      } : 1,
      width: this.minimal ? "33%" : "100%",
      height: this.minimal ? "100%" : "34%",
      valign: "middle",
      border: {
        type: "line"
      },
      style: {
        fg: -1,
        border: {
          fg: this.color
        }
      }
    });

    this.progressbar = new blessed.ProgressBar({
      parent: this.progress,
      height: 1,
      width: "90%",
      top: "center",
      left: "center",
      hidden: this.minimal,
      orientation: "horizontal",
      style: {
        bar: {
          bg: this.color
        }
      }
    });

    this.screen.append(this.wrapper);
  }
}

module.exports = Dashboard;
