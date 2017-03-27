"use strict";

const filesize = require("filesize");

function getAssets(stats) {
  return stats.assets;
}

function printAssets(tree) {
  let total = 0;
  const output = [
    ["Name", "Size"]
  ];
  tree.forEach((assets) => {
    assets.forEach((asset) => {
      if (asset.name.indexOf("hot-update") < 0) {
        total += asset.size;
        output.push([asset.name, filesize(asset.size)]);
      }
    });
  });

  output.push(["Total", filesize(total)]);

  return output;
}

function formatAssets(stats) {
  const json = stats.toJson();
  let tree;
  if (!json.hasOwnProperty("assets")) {
    tree = json.children.map(getAssets);
  } else {
    tree = [getAssets(json)];
  }
  return printAssets(tree);
}

module.exports = formatAssets;
