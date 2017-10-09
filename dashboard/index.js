"use strict";

const _ = require("lodash/fp");
const chalk = require("chalk");
const blessed = require("blessed");

const formatOutput = require("../utils/format-output.js");
const formatModules = require("../utils/format-modules.js");
const formatAssets = require("../utils/format-assets.js");
const formatProblems = require("../utils/format-problems.js");
const deserializeError = require("../utils/error-serialization").deserializeError;

const PERCENT_MULTIPLIER = 100;

const DEFAULT_SCROLL_OPTIONS = {
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
};

class Dashboard {
  constructor(options) {
    const title = options && options.title || "webpack-dashboard";

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
      this.layoutProblems();
    }

    this.screen.key(["escape", "q", "C-c"], () => {
      // eslint-disable-next-line no-process-exit
      process.exit(0);
    });

    this.screen.render();
  }

  setData(dataArray) {
    const actionForMessageType = data => {
      const map = {
        progress: this.setProgress.bind(this),
        operations: this.setOperations.bind(this),
        status: this.setStatus.bind(this),
        stats: this.setStats.bind(this),
        nodeEnv: this.setNodeEnv.bind(this),
        log: this.setLog.bind(this),
        clear: this.clear.bind(this),
        sizes: _data => {
          if (this.minimal) { return; }
          if (_data.value instanceof Error) {
            this.setSizesError(_data.value);
          } else {
            this.setSizes(_data);
          }
        },
        problems: _data => {
          if (this.minimal) { return; }
          if (_data.value instanceof Error) {
            this.setProblemsError(_data.value);
          } else {
            this.setProblems(_data);
          }
        }
      };
      return map[data.type](data);
    };

    dataArray
      .map(data => data.error ?
        Object.assign({}, data, {
          value: deserializeError(data.value)
        }) : data
      )
      .forEach(actionForMessageType);

    this.screen.render();
  }

  setProgress(data) {
    const percent = parseInt(data.value * PERCENT_MULTIPLIER, 10);
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

  setNodeEnv(data) {
    this.nodeEnv = data.value;
    if (this.nodeEnv === "production") {
      this.setProductionConfigurationWarning();
    }
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
      this.modulesMenu.setLabel(chalk.yellow("Modules (loading...)"));
      this.assets.setLabel(chalk.yellow("Assets (loading...)"));
      this.problemsMenu.setLabel(chalk.yellow("Problems (loading...)"));
    }
  }

  setSizes(data) {
    this.modulesMenu.setLabel("Modules");
    this.assets.setLabel("Assets");

    const result = _.flow(
      _.groupBy("path"),
      _.mapValues(_.reduce((acc, bundle) =>
        Object.assign({}, acc, bundle), {}
      )),
      _.mapValues(bundle => () => {
        this.moduleTable.setData(formatModules(bundle));
        this.screen.render();
      })
    )(data.value);

    const previousSelection = this.modulesMenu.selected;
    this.modulesMenu.setItems(result);
    this.modulesMenu.selectTab(previousSelection);

    this.assetTable.setData(formatAssets(this.stats, data.value));

    this.screen.render();
  }

  setSizesError(err) {
    this.modulesMenu.setLabel(chalk.red("Modules (error)"));
    this.assets.setLabel(chalk.red("Assets (error)"));
    this.logText.log(chalk.red("Could not load module/asset sizes."));
    this.logText.log(chalk.red(err));
  }

  setProductionConfigurationWarning() {
    this.modulesMenu.setLabel(chalk.yellow("Modules (warning)"));
    this.assets.setLabel(chalk.yellow("Assets (warning)"));
    this.moduleTable.setData([[
      // eslint-disable-next-line max-len
      "It appears you are using a production config. Therefore there are no code sections that could be analyzed. To see more on modules and assets switch to a development configuration."
    ]]);
    this.assetTable.setData([[
      "Unable to list specific asset data."
    ]]);
    this.problemsMenu.setLabel(chalk.yellow("Problems (warning)"));
    this.problems.setContent("Unable to analyze problems.");
  }

  setProblems(data) {
    this.problemsMenu.setLabel("Problems");

    const result = _.flow(
      _.groupBy("path"),
      _.mapValues(_.reduce((acc, bundle) =>
        Object.assign({}, acc, bundle), {}
      )),
      _.mapValues(bundle => () => {
        this.problems.setContent(formatProblems(bundle));
        this.screen.render();
      })
    )(data.value);

    const previousSelection = this.problemsMenu.selected;
    this.problemsMenu.setItems(result);
    this.problemsMenu.selectTab(previousSelection);

    this.screen.render();
  }

  setProblemsError(err) {
    this.problemsMenu.setLabel(chalk.red("Problems (error)"));
    this.logText.log(chalk.red("Could not analyze bundle problems."));
    this.logText.log(chalk.red(err.stack));
  }

  setLog(data) {
    if (this.stats && this.stats.hasErrors()) {
      return;
    }
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
      height: this.minimal ? "70%" : "36%",
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

    this.logText = blessed.log(
      Object.assign({}, DEFAULT_SCROLL_OPTIONS, {
        parent: this.log,
        tags: true,
        width: "100%-5"
      })
    );

    this.screen.append(this.log);
    this.mapNavigationKeysToScrollLog();
  }

  mapNavigationKeysToScrollLog() {
    this.screen.key(["pageup"], () => {
      this.logText.setScrollPerc(0);
      this.logText.screen.render();
    });
    this.screen.key(["pagedown"], () => {
      // eslint-disable-next-line no-magic-numbers
      this.logText.setScrollPerc(100);
      this.logText.screen.render();
    });
    this.screen.key(["up"], () => {
      this.logText.scroll(-1);
      this.logText.screen.render();
    });
    this.screen.key(["down"], () => {
      this.logText.scroll(1);
      this.logText.screen.render();
    });
  }

  layoutModules() {
    this.modulesMenu = blessed.listbar({
      label: "Modules",
      mouse: true,
      tags: true,
      width: "50%",
      height: "66%",
      left: "0%",
      top: "36%",
      border: {
        type: "line"
      },
      padding: 1,
      style: {
        fg: -1,
        border: {
          fg: this.color
        },
        prefix: {
          fg: -1
        },
        item: {
          fg: "white"
        },
        selected: {
          fg: "black",
          bg: this.color
        }
      },
      autoCommandKeys: true
    });

    this.moduleTable = blessed.table(
      Object.assign({}, DEFAULT_SCROLL_OPTIONS, {
        parent: this.modulesMenu,
        height: "100%",
        width: "100%-5",
        padding: {
          top: 2,
          right: 1,
          left: 1
        },
        align: "left",
        data: [["Name", "Size (min+gz)", "Percentage"]]
      })
    );

    this.screen.append(this.modulesMenu);
  }

  layoutAssets() {
    this.assets = blessed.box({
      label: "Assets",
      tags: true,
      padding: 1,
      width: "50%",
      height: "28%",
      left: "50%",
      top: "36%",
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

    this.assetTable = blessed.table(
      Object.assign({}, DEFAULT_SCROLL_OPTIONS, {
        parent: this.assets,
        height: "100%",
        width: "100%-5",
        align: "left",
        padding: 1,
        data: [["Name", "Size"]]
      })
    );

    this.screen.append(this.assets);
  }

  layoutProblems() {
    this.problemsMenu = blessed.listbar({
      label: "Problems",
      mouse: true,
      width: "50%",
      height: "38%",
      left: "50%",
      top: "63%",
      border: {
        type: "line"
      },
      padding: {
        top: 1
      },
      style: {
        border: {
          fg: this.color
        },
        prefix: {
          fg: -1
        },
        item: {
          fg: "white"
        },
        selected: {
          fg: "black",
          bg: this.color
        }
      },
      autoCommandKeys: true
    });

    this.problems = blessed.box(
      Object.assign({}, DEFAULT_SCROLL_OPTIONS, {
        parent: this.problemsMenu,
        padding: 1,
        border: {
          fg: -1
        },
        style: {
          fg: -1,
          border: {
            fg: this.color
          }
        }
      })
    );

    this.screen.append(this.problemsMenu);
  }

  // eslint-disable-next-line complexity
  layoutStatus() {
    this.wrapper = blessed.layout({
      width: this.minimal ? "100%" : "25%",
      height: this.minimal ? "30%" : "36%",
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
      width: this.minimal ? "34%-1" : "100%",
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
      width: this.minimal ? "34%-1" : "100%",
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
