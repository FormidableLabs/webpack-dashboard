"use strict";

var filesize = require('filesize');

function formatAssets(stats) {
  var json = stats.toJson();
  var tree;
  if (!json.hasOwnProperty('assets')) {
    tree = json.children.map(getAssets);
  } else {
    tree = [getAssets(json)];
  }
  return printAssets(tree);
}

function getAssets(stats) {
  return stats.assets;
}

function printAssets(tree) {
  var output = [
    ['Name', 'Size']
  ];
  tree.forEach(function(assets) {
    assets.forEach(function(asset) {
      output.push([asset.name, filesize(asset.size)]);
    });
  });

  return output;
}

module.exports = formatAssets;
