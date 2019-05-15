"use strict";

/**
 * Modules are the individual files within an asset.
 */
const { relative, resolve, sep } = require("path");
const filesize = require("filesize");

const PERCENT_MULTIPLIER = 100;
const PERCENT_PRECISION = 3;

// Convert to:
// - existing source file name
// - the path leading up to **just** the package (not including subpath).
function _formatFileName(mod) {
  const { fileName, baseName } = mod;

  // Source file.
  if (!baseName) {
    return `{green-fg}.${sep}${relative(process.cwd(), resolve(fileName))}{/}`;
  }

  // Package
  let parts = fileName.split(sep);
  // Remove starting path.
  const firstNmIdx = parts.indexOf("node_modules");
  parts = parts.slice(firstNmIdx);

  // Remove trailing path after package.
  const lastNmIdx = parts.lastIndexOf("node_modules");
  const isScoped = (parts[lastNmIdx + 1] || "").startsWith("@");
  parts = parts.slice(0, lastNmIdx + (isScoped ? 3 : 2)); // eslint-disable-line no-magic-numbers

  return parts.map(part => (part === "node_modules" ? "~" : `{yellow-fg}${part}{/}`)).join(sep);
}

function _formatPercentage(modSize, assetSize) {
  const percentage = ((modSize / assetSize) * PERCENT_MULTIPLIER).toPrecision(PERCENT_PRECISION);

  return `${percentage}%`;
}

function formatModules(mods) {
  // We _could_ use the `asset.meta.full` from inspectpack, but that is for
  // the entire module with boilerplate included. We instead do a percentage
  // of the files we're counting here.
  const assetSize = mods.reduce((count, mod) => count + mod.size.full, 0);

  // First, process the modules into a map to normalize file paths.
  const modsMap = mods.reduce((memo, mod) => {
    // File name collapses to packages for dependencies.
    // Aggregate into object.
    const fileName = _formatFileName(mod);

    // Add in information.
    memo[fileName] = memo[fileName] || {
      fileName,
      num: 0,
      size: 0
    };
    memo[fileName].num += 1;
    memo[fileName].size += mod.size.full;

    return memo;
  }, {});

  return [].concat(
    [["Name", "Size", "Percent"]],
    Object.keys(modsMap)
      .map(fileName => modsMap[fileName])
      .sort((a, b) => a.size < b.size) // sort largest first
      .map(mod => [
        `${mod.fileName} ${mod.num > 1 ? `(${mod.num})` : ""}`,
        filesize(mod.size),
        _formatPercentage(mod.size, assetSize)
      ])
  );
}

module.exports = {
  formatModules,
  _formatFileName,
  _formatPercentage
};
