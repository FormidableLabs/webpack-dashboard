"use strict";

var filesize = require('filesize');
var path = require('path');

function getPosition(string, needle, i) {
  return string.split(needle, i).join(needle).length;
}

function modulePath(identifier) {
  var loaderRegex = /.*!/;
  return identifier.replace(loaderRegex, '');
}

function moduleDirPath(modulePath) {
  var moduleDirRegex = new RegExp('(.*?node_modules\\' + path.sep + '.*?)\\' + path.sep);
  return modulePath.match(moduleDirRegex)[1];
}

function formatModules(stats) {
  var json = stats.toJson();
  var trees;
  if (!json.hasOwnProperty('modules')) {
    trees = json.children.map(bundleSizeTree);
  } else {
    trees = [bundleSizeTree(json)];
  }
  return printTrees(trees);
}

function printTrees(trees) {
  var output = [
    ['Name', 'Size', 'Percentage']
  ];
  trees.forEach(function(tree) {
    printDependencySizeTree(tree, 0, function(data) {
      output.push(data);
    });
  });
  return output;
}

function printDependencySizeTree(node, depth, outputFn) {
  var childrenBySize = node.children.sort(function(a, b) {
    return b.size - a.size;
  });

  var totalSize = node.size;
  var remainder = totalSize;
  var includedCount = 0;

  var prefix = '';
  for (var i=0; i < depth; i++) {
    prefix += '  ';
  }

  for (var child of childrenBySize) {
    ++includedCount;
    var percentage = ((child.size/totalSize) * 100).toPrecision(3);
    outputFn([prefix + child.packageName + "@" + child.packageVersion, prefix + filesize(child.size), prefix + percentage + "%"]);

    printDependencySizeTree(child, depth + 1, outputFn);

    remainder -= child.size;

    if (remainder < 0.01 * totalSize) {
      break;
    }
  }

  if (depth === 0 || remainder !== totalSize) {
    var percentage = ((remainder/totalSize) * 100).toPrecision(3);
    outputFn([prefix + "<self>", prefix + filesize(remainder), prefix + percentage + "%"]);
  }
}

function bundleSizeTree(stats) {
  var statsTree = {
    packageName: '<root>',
    packageVersion: '',
    size: 0,
    children: []
  };

  if (stats.name) {
    statsTree.bundleName = stats.name;
  }

  var modules = stats.modules.map(function(mod) {
    return {
      path: modulePath(mod.identifier),
      size: mod.size
    };
  });

  modules.sort(function(a, b) {
    if (a === b) {
      return 0;
    } else {
      return a < b ? -1 : 1;
    }
  });

  modules.forEach(function(mod) {
    var packages = mod.path.split(new RegExp('\\' + path.sep + 'node_modules\\' + path.sep));
    var filename = '';
    if (packages.length > 1) {
      var lastSegment = packages.pop();

      var lastPackageName = ''
      if (lastSegment.indexOf('@')) {
        lastPackageName = lastSegment.slice(0, lastSegment.search(new RegExp('\\' + path.sep + '|$')));
      } else {
        lastPackageName = lastSegment.slice(0, getPosition(lastSegment, path.sep, 2));
      }

      packages.push(lastPackageName);
      filename = lastSegment.slice(lastPackageName.length + 1);
    } else {
      filename = packages[0];
    }
    packages.shift();

    var parent = statsTree;
    parent.size += mod.size;
    packages.forEach(function(pkg) {
      var existing = parent.children.filter(function(child) {
        return child.packageName === pkg
      });
      var packageVersion = '';
      if (existing.length > 0) {
        existing[0].size += mod.size;
        parent = existing[0];
      } else {
        try {
          packageVersion = require(path.join(moduleDirPath(mod.path), 'package.json')).version;
        } catch (err) {
          packageVersion = ''
        }
        var newChild = {
          packageName: pkg,
          packageVersion: packageVersion,
          size: mod.size,
          children: []
        };
        parent.children.push(newChild);
        parent = newChild;
      }
    });
  });

  return statsTree;
}

module.exports = formatModules;
