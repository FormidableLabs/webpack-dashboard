"use strict";
// DONE(IP3)

/**
 * Modules are the individual files within an asset.
 */
const { relative } = require("path");

const PERCENT_MULTIPLIER = 100;
const PERCENT_PRECISION = 3;

function formatPercentage(modSize, assetSize) {
  const percentage = (modSize / assetSize * PERCENT_MULTIPLIER)
    .toPrecision(PERCENT_PRECISION);

  return `${percentage}%`;
}

function formatModules(modules, assetSize) {
  return [].concat(
    [["Name", "Size", "Percentage"]],
    modules.map((mod) => [
      mod.baseName || `./${relative(process.cwd(), mod.fileName)}`,
      mod.size.full,
      formatPercentage(mod.size.full, assetSize)
    ])
  );
}

module.exports = formatModules;
