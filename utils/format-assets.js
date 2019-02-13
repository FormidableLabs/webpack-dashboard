"use strict";

/**
 * Assets are the full emitted bundles.
 */
const filesize = require("filesize");

function _getAssetSize(asset) {
  return filesize(asset.size || 0);
}

function _getTotalSize(assetsList) {
  return filesize(assetsList.reduce((total, asset) => total + (asset.size || 0), 0));
}

function _printAssets(assetsList) {
  return [["Name", "Size"]]
    .concat(assetsList.map(asset => [asset.name, _getAssetSize(asset)]))
    .concat([["Total", _getTotalSize(assetsList)]]);
}

function formatAssets(assets) {
  // Convert to list.
  const assetsList = Object.keys(assets).map(name => ({
    name,
    size: assets[name].meta.full
  }));

  return _printAssets(assetsList);
}

module.exports = { formatAssets, _getAssetSize, _getTotalSize, _printAssets };
