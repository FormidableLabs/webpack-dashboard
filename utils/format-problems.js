"use strict";

const chalk = require("chalk");
const formatDuplicates = require("./format-duplicates");
const formatVersions = require("./format-versions");

function formatProblems(bundle) {
  const duplicates = formatDuplicates(bundle.duplicates);
  // Versions may be undefined if we couldn't get a project root.
  const versions = typeof bundle.versions === "undefined" ?
    `${chalk.yellow("Unable to diagnose possible version skews\n")}` :
    formatVersions(bundle.versions);

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
