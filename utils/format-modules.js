"use strict";
// DONE(IP3)
// TODO(IP3): Removed modules groupings. _Could_ re-add this in as a future feature / ticket.

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

function formatModules(mods) {
  // We _could_ use the `asset.meta.full` from inspectpack, but that is for
  // the entire module with boilerplate included. We instead do a percentage
  // of the files we're counting here.
  const assetSize = mods.reduce((count, mod) => count + mod.size.full, 0);

  return [].concat(
    [["Name", "Size", "Percentage"]],
    mods.map(mod => [
      mod.baseName || `./${relative(process.cwd(), mod.fileName)}`,
      mod.size.full,
      formatPercentage(mod.size.full, assetSize)
    ])
  );
}

module.exports = formatModules;
