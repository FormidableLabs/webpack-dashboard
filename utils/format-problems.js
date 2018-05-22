"use strict";

const chalk = require("chalk");
const formatDuplicates = require("./format-duplicates");
const formatVersions = require("./format-versions");

function formatProblems(data) {
  const duplicates = formatDuplicates(data.duplicates);
  const versions = formatVersions(data.versions);

  if (!duplicates && !versions) {
    return chalk.green("No problems detected!");
  }
  if (duplicates && !versions) {
    return `${chalk.green("No version skews!\n")}\n${duplicates}`;
  }
  if (!duplicates && versions) {
    return `${chalk.green("No duplicate files!")}\n${versions}`;
  }

  return `${duplicates}\n${versions}`;
}

module.exports = formatProblems;
