"use strict";
const _ = require("lodash/fp");
const filesize = require("filesize");

const ipUtils = require("./inspectpack");
const getSize = ipUtils.getSize;
const hasSize = ipUtils.hasSize;

function getAssets(stats) {
  return stats.assets;
}

function getAssetSize(asset) {
  // Inspectpack returns things with `.full` raw size. Webpack returns `.size`.
  let size = asset.full || asset.size || 0;
  let sizeType = "";
  if (hasSize(asset.minGz)) {
    size = getSize(asset.minGz);
    sizeType = " (min+gz)";
  } else if (hasSize(asset.min)) {
    size = getSize(asset.min);
    sizeType = " (min)";
  }

  return `${filesize(size)}${sizeType || ""}`;
}

function getTotalSize(assets) {
  return filesize(assets.reduce(
    (total, asset) => total + (asset.full || asset.size || 0),
    0
  ));
}

function resolveAssets(tree, bundles) {
  return _.flatMap(assets =>
    assets
      .filter(asset => asset.name.indexOf("hot-update") < 0)
      .map(asset => {
        const realBundleMatch = _.find({ path: asset.name })(bundles);
        const realMeta = (((realBundleMatch || {}).metrics || {}).meta || {}).bundle || {};
        return realBundleMatch ? {
          name: realBundleMatch.path,
          full: realMeta.full || realMeta.size || 0,
          min: hasSize(realMeta.min) ? getSize(realMeta.min) : undefined,
          minGz: hasSize(realMeta.minGz) ? getSize(realMeta.minGz) : undefined
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
