"use strict";

const chalk = require("chalk");
const formatDuplicates = require("./format-duplicates");
const formatVersions = require("./format-versions");

function formatProblems(data) {
  const duplicates = formatDuplicates(data.duplicates); // TODO(IP3): Refactor
  // Versions may be undefined if we couldn't get a project root.
  const versions = typeof data.versions === "undefined" ?
    `${chalk.yellow("Unable to diagnose possible version skews\n")}` :
    formatVersions(data.versions); // TODO(IP3): Refactor

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
