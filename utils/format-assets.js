"use strict";
// DONE(IP3)

/**
 * Assets are the full emitted bundles.
 */

const filesize = require("filesize");

function getAssets(stats) {
  return stats.assets;
}

function getAssetSize(asset) {
  return filesize(asset.size || 0);
}

function getTotalSize(assets) {
  return filesize(assets.reduce(
    (total, asset) => total + (asset.size || 0),
    0
  ));
}

function resolveAssets(tree) {
  return tree
    // Flatten one level.
    .reduce((m, a) => m.concat(a), [])
    // Remove hot update cruft.
    .filter(asset => asset.name.indexOf("hot-update") < 0);
}

function printAssets(tree) {
  const assets = resolveAssets(tree);

  return [["Name", "Size"]]
    .concat(assets.map(asset =>
      [asset.name, getAssetSize(asset)]
    ))
    .concat(
      [["Total", getTotalSize(assets)]]
    );
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
