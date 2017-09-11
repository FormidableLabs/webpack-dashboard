"use strict";

const chalk = require("chalk");
const formatDuplicates = require("./format-duplicates");
const formatVersions = require("./format-versions");

function formatProblems(bundle) {
  const duplicates = formatDuplicates(bundle.duplicates);
  const versions = formatVersions(bundle.versions);
  if (!duplicates && !versions) {
    return chalk.green("No problems detected!");
  }
  if (duplicates && !versions) {
    return `${chalk.green("No version skews!\n")}\n${duplicates}`;
  }
  if (!duplicates && versions) {
    return `${chalk.green("No duplicate files!")}\n${versions}`;
  }
  return `${formatDuplicates(bundle.duplicates)}\n${formatVersions(
    bundle.versions
  )}`;
}

module.exports = formatProblems;
