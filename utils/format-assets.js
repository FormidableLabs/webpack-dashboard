"use strict";
const _ = require("lodash/fp");
const filesize = require("filesize");

function getAssets(stats) {
  return stats.assets;
}

function getAssetSize(asset) {
  return `${filesize(asset.size)}${asset.minGz && " (min+gz)" || ""}`;
}

function getTotalSize(assets) {
  return filesize(assets.reduce(
    (total, asset) => total + asset.size,
    0
  ));
}

function resolveAssets(tree, bundles) {
  return _.flatMap(assets =>
    assets
      .filter(asset => asset.name.indexOf("hot-update") < 0)
      .map(asset => {
        const realBundleMatch = _.find({ path: asset.name })(bundles);
        return realBundleMatch ? {
          name: realBundleMatch.path,
          size: realBundleMatch.metrics ? realBundleMatch.metrics.meta.bundle.minGz : 0,
          minGz: true
        } : asset;
      })
  )(tree);
}

function printAssets(tree, bundles) {
  const assets = resolveAssets(tree, bundles);

  return [["Name", "Size"]]
    .concat(assets.map(asset =>
      [asset.name, getAssetSize(asset)]
    ))
    .concat(
      [["Total", getTotalSize(assets)]]
    );
}

function formatAssets(stats, bundles) {
  const json = stats.toJson();
  let tree;
  if (!json.hasOwnProperty("assets")) {
    tree = json.children.map(getAssets);
  } else {
    tree = [getAssets(json)];
  }
  return printAssets(tree, bundles);
}

module.exports = formatAssets;
