"use strict";

const filesize = require("filesize");
const path = require("path");

function getPosition(string, needle, i) {
  return string.split(needle, i).join(needle).length;
}

function modulePath(identifier) {
  const loaderRegex = /.*!/;
  return identifier.replace(loaderRegex, "");
}

function moduleDirPath(modulePath) {
  const moduleDirRegex = new RegExp(`(.*?node_modules\\${ path.sep }.*?)\\${ path.sep}`);
  return modulePath.match(moduleDirRegex)[1];
}

function formatModules(stats) {
  const json = stats.toJson();
  let trees;
  if (!json.hasOwnProperty("modules")) {
    trees = json.children.map(bundleSizeTree);
  } else {
    trees = [bundleSizeTree(json)];
  }
  return printTrees(trees);
}

function printTrees(trees) {
  const output = [
    ["Name", "Size", "Percentage"]
  ];
  trees.forEach((tree) => {
    printDependencySizeTree(tree, 0, (data) => {
      output.push(data);
    });
  });
  return output;
}

function printDependencySizeTree(node, depth, outputFn) {
  const childrenBySize = node.children.sort((a, b) => {
    return b.size - a.size;
  });

  const totalSize = node.size;
  let remainder = totalSize;
  let includedCount = 0;

  let prefix = "";
  for (let i = 0; i < depth; i++) {
    prefix += "  ";
  }

  for (const child of childrenBySize) {
    ++includedCount;
    var percentage = (child.size / totalSize * 100).toPrecision(3);
    outputFn([`${prefix + child.packageName }@${ child.packageVersion}`, prefix + filesize(child.size), `${prefix + percentage }%`]);

    printDependencySizeTree(child, depth + 1, outputFn);

    remainder -= child.size;

    if (remainder < 0.01 * totalSize) {
      break;
    }
  }

  if (depth === 0 || remainder !== totalSize) {
    var percentage = (remainder / totalSize * 100).toPrecision(3);
    outputFn([`${prefix }<self>`, prefix + filesize(remainder), `${prefix + percentage }%`]);
  }
}

function bundleSizeTree(stats) {
  const statsTree = {
    packageName: "<root>",
    packageVersion: "",
    size: 0,
    children: []
  };

  if (stats.name) {
    statsTree.bundleName = stats.name;
  }

  const modules = stats.modules.map((mod) => {
    return {
      path: modulePath(mod.identifier),
      size: mod.size
    };
  });

  modules.sort((a, b) => {
    if (a === b) {
      return 0;
    } else {
      return a < b ? -1 : 1;
    }
  });

  modules.forEach((mod) => {
    const packages = mod.path.split(new RegExp(`\\${ path.sep }node_modules\\${ path.sep}`));
    let filename = "";
    if (packages.length > 1) {
      const lastSegment = packages.pop();

      let lastPackageName = "";
      if (lastSegment.indexOf("@")) {
        lastPackageName = lastSegment.slice(0, lastSegment.search(new RegExp(`\\${ path.sep }|$`)));
      } else {
        lastPackageName = lastSegment.slice(0, getPosition(lastSegment, path.sep, 2));
      }

      packages.push(lastPackageName);
      filename = lastSegment.slice(lastPackageName.length + 1);
    } else {
      filename = packages[0];
    }
    packages.shift();

    let parent = statsTree;
    parent.size += mod.size;
    packages.forEach((pkg) => {
      const existing = parent.children.filter((child) => {
        return child.packageName === pkg;
      });
      let packageVersion = "";
      if (existing.length > 0) {
        existing[0].size += mod.size;
        parent = existing[0];
      } else {
        try {
          packageVersion = require(path.join(moduleDirPath(mod.path), "package.json")).version;
        } catch (err) {
          packageVersion = "";
        }
        const newChild = {
          packageName: pkg,
          packageVersion,
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
