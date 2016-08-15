/* eslint-disable */
'use strict';

var blessed = require('blessed');
var formatOutput = require('../utils/format-output.js');
var formatModules = require('../utils/format-modules.js');
var formatAssets = require('../utils/format-assets.js');

function Dashboard(options) {
  this.color = options && options.color || "green";
  this.setData = this.setData.bind(this);

  this.screen = blessed.screen({
    smartCSR: true,
    title: 'reactotron',
    dockBorders: false,
    fullUnicode: true,
    autoPadding: true
  });

  this.layoutLog.call(this);
  this.layoutStatus.call(this);
  this.layoutModules.call(this);
  this.layoutAssets.call(this);

  this.screen.key(['escape', 'q', 'C-c'], function() {
    process.exit(0);
  });

  this.screen.render();
}

Dashboard.prototype.setData = function(data) {
  switch (data.type) {
    case 'progress': {
      var percent = parseInt(data.value * 100);
      this.progressbar.setProgress(percent);
      this.screen.render();
      break;
    }
    case 'operations': {
      this.operations.setContent(data.value);
      this.screen.render();
      break;
    }
    case 'status': {
      let content;

      switch(data.value) {
        case 'Success':
          content = '{green-fg}{bold}' + data.value + '{/}';
          break;
        case 'Failed':
          content = '{red-fg}{bold}' + data.value + '{/}';
          break;
        default:
          content = '{white-fg}{bold}' + data.value + '{/}';
      }

      this.status.setContent(content);
      this.screen.render();

      break;
    }
    case 'stats': {
      var stats = data.value;
      if (stats.hasErrors()) {
        this.status.setContent('{red-fg}{bold}Failed{/}');
      }
      this.logText.setContent(formatOutput(stats));
      this.moduleTable.setData(formatModules(stats));
      this.assetTable.setData(formatAssets(stats));
      this.screen.render();

      break;
    }
    default: {
      break;
    }
  }
};

Dashboard.prototype.layoutLog = function() {
  this.log = blessed.box({
    label: 'Log',
    padding: 1,
    width: '75%',
    height: '42%',
    left: '0%',
    top: '0%',
    border: {
      type: 'line',
    },
    style: {
      fg: 'white',
      border: {
        fg: this.color,
      },
    },
  });

  this.logText = blessed.text({
    parent: this.log,
    tags: true,
    width: "100%-5",
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
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
    label: 'Modules',
    tags: true,
    padding: 1,
    width: '50%',
    height: '58%',
    left: '0%',
    top: '42%',
    border: {
      type: 'line',
    },
    style: {
      fg: 'white',
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
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      inverse: true
    },
    keys: true,
    vi: true,
    mouse: true,
    data: [['Name', 'Size', 'Percentage']]
  });

  this.screen.append(this.modules);
};

Dashboard.prototype.layoutAssets = function() {
  this.assets = blessed.box({
    label: 'Assets',
    tags: true,
    padding: 1,
    width: '50%',
    height: '58%',
    left: '50%',
    top: '42%',
    border: {
      type: 'line',
    },
    style: {
      fg: 'white',
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
      ch: ' ',
      inverse: true
    },
    keys: true,
    vi: true,
    mouse: true,
    data: [['Name', 'Size']]
  });

  this.screen.append(this.assets);
};

Dashboard.prototype.layoutStatus = function() {

  this.wrapper = blessed.layout({
    width: "25%",
    height: "42%",
    top: "0%",
    left: "75%",
    layout: "grid"
  });

  this.status = blessed.box({
    parent: this.wrapper,
    label: 'Status',
    tags: true,
    padding: 1,
    width: '100%',
    height: '34%',
    valign: "middle",
    border: {
      type: 'line',
    },
    style: {
      fg: 'white',
      border: {
        fg: this.color,
      },
    },
  });

  this.operations = blessed.box({
    parent: this.wrapper,
    label: 'Operation',
    tags: true,
    padding: 1,
    width: '100%',
    height: '34%',
    valign: "middle",
    border: {
      type: 'line',
    },
    style: {
      fg: 'white',
      border: {
        fg: this.color,
      },
    },
  });

  this.progress = blessed.box({
    parent: this.wrapper,
    label: 'Progress',
    tags: true,
    padding: 1,
    width: '100%',
    height: '34%',
    valign: "middle",
    border: {
      type: 'line',
    },
    style: {
      fg: 'white',
      border: {
        fg: this.color,
      },
    },
  });

  this.progressbar = blessed.ProgressBar({
    parent: this.progress,
    height: 1,
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
