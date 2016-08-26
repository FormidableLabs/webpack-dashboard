/* eslint-disable */
"use strict";

var blessed = require("blessed");

var formatOutput = require("../utils/format-output.js");
var formatModules = require("../utils/format-modules.js");
var formatAssets = require("../utils/format-assets.js");

function Dashboard(options) {
  var title = options && options.title || "webpack-dashboard";

  this.color = options && options.color || "green";
  this.minimal = options && options.minimal || false;
  this.setData = this.setData.bind(this);

  this.screen = blessed.screen({
    smartCSR: true,
    title: title,
    dockBorders: false,
    fullUnicode: true,
    autoPadding: true
  });

  this.layoutLog.call(this);
  this.layoutStatus.call(this);
  !this.minimal && this.layoutModules.call(this);
  !this.minimal && this.layoutAssets.call(this);

  this.screen.key(["escape", "q", "C-c"], function() {
    process.exit(0);
  });

  this.screen.render();
}

Dashboard.prototype.setData = function(dataArr) {
  var self = this;

  dataArr.forEach(function(data) {
    switch (data.type) {
      case "progress": {
        var percent = parseInt(data.value * 100);
        if (self.minimal) {
          percent && self.progress.setContent(percent.toString() + "%");
        } else {
          percent && self.progressbar.setContent(percent.toString() + "%");
          self.progressbar.setProgress(percent);
        }
        break;
      }
      case "operations": {
        self.operations.setContent(data.value);
        break;
      }
      case "status": {
        var content;

        switch(data.value) {
          case "Success":
            content = "{green-fg}{bold}" + data.value + "{/}";
            break;
          case "Failed":
            content = "{red-fg}{bold}" + data.value + "{/}";
            break;
          default:
            content = "{bold}" + data.value + "{/}";
        }
        self.status.setContent(content);
        break;
      }
      case "stats": {
        var stats = {
          hasErrors: function() {
            return data.value.errors;
          },
          hasWarnings: function() {
            return data.value.warnings;
          },
          toJson: function() {
            return data.value.data;
          }
        };
        if (stats.hasErrors()) {
          self.status.setContent("{red-fg}{bold}Failed{/}");
        }
        self.logText.log(formatOutput(stats));
        !self.minimal && self.moduleTable.setData(formatModules(stats));
        !self.minimal && self.assetTable.setData(formatAssets(stats));
        break;
      }
      case "log": {
        var filteredValue = data.value.replace(/[{}]/g, "");
        self.logText.log(filteredValue);
        break;
      }
      case "clear": {
        self.logText.setContent("");
        break;
      }
    }
  });

  this.screen.render();
};

Dashboard.prototype.layoutLog = function() {
  this.log = blessed.box({
    label: "Log",
    padding: 1,
    width: this.minimal ? "100%" : "75%",
    height: this.minimal ? "70%" : "42%",
    left: "0%",
    top: "0%",
    border: {
      type: "line",
    },
    style: {
      fg: -1,
      border: {
        fg: this.color,
      },
    },
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
};

Dashboard.prototype.layoutModules = function() {
  this.modules = blessed.box({
    label: "Modules",
    tags: true,
    padding: 1,
    width: "50%",
    height: "58%",
    left: "0%",
    top: "42%",
    border: {
      type: "line",
    },
    style: {
      fg: -1,
      border: {
        fg: this.color,
      },
    },
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
    data: [["Name", "Size", "Percentage"]]
  });

  this.screen.append(this.modules);
};

Dashboard.prototype.layoutAssets = function() {
  this.assets = blessed.box({
    label: "Assets",
    tags: true,
    padding: 1,
    width: "50%",
    height: "58%",
    left: "50%",
    top: "42%",
    border: {
      type: "line",
    },
    style: {
      fg: -1,
      border: {
        fg: this.color,
      },
    },
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
};

Dashboard.prototype.layoutStatus = function() {

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
      left: 1,
    },
    width: this.minimal ? "34%" : "100%",
    height: this.minimal ? "100%" : "34%",
    valign: "middle",
    border: {
      type: "line",
    },
    style: {
      fg: -1,
      border: {
        fg: this.color,
      },
    },
  });

  this.operations = blessed.box({
    parent: this.wrapper,
    label: "Operation",
    tags: true,
    padding: {
      left: 1,
    },
    width: this.minimal ? "34%" : "100%",
    height: this.minimal ? "100%" : "34%",
    valign: "middle",
    border: {
      type: "line",
    },
    style: {
      fg: -1,
      border: {
        fg: this.color,
      },
    },
  });

  this.progress = blessed.box({
    parent: this.wrapper,
    label: "Progress",
    tags: true,
    padding: this.minimal ? {
      left: 1,
    } : 1,
    width: this.minimal ? "33%" : "100%",
    height: this.minimal ? "100%" : "34%",
    valign: "middle",
    border: {
      type: "line",
    },
    style: {
      fg: -1,
      border: {
        fg: this.color,
      },
    },
  });

  this.progressbar = blessed.ProgressBar({
    parent: this.progress,
    height: 1,
    width: "90%",
    top: "center",
    left: "center",
    hidden: this.minimal,
    orientation: "horizontal",
    style: {
      bar: {
        bg: this.color,
      },
    }
  });

  this.screen.append(this.wrapper);
};

module.exports = Dashboard;
