"use strict";

/**
 * Assets are the full emitted bundles.
 */
const filesize = require("filesize");

function getAssetSize(asset) {
  return filesize(asset.size || 0);
}

function getTotalSize(assetsList) {
  return filesize(assetsList.reduce(
    (total, asset) => total + (asset.size || 0),
    0
  ));
}

function printAssets(assetsList) {
  return [["Name", "Size"]]
    .concat(assetsList.map(asset =>
      [asset.name, getAssetSize(asset)]
    ))
    .concat(
      [["Total", getTotalSize(assetsList)]]
    );
}

function formatAssets(assets) {
  // Convert to list.
  const assetsList = Object.keys(assets).map(name => ({
    name,
    size: assets[name].meta.full
  }));

  return printAssets(assetsList);
}

module.exports = formatAssets;
