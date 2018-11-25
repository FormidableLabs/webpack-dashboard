"use strict";

const formatDuplicates = require("./format-duplicates");
const formatVersions = require("./format-versions");

function formatProblems(data) {
  const duplicates = formatDuplicates(data.duplicates);
  const versions = formatVersions(data.versions);

  if (!duplicates && !versions) {
    return "{green-fg}No problems detected!{/}";
  }
  if (duplicates && !versions) {
    return `{green-fg}No version skews!{/}\n\n${duplicates}`;
  }
  if (!duplicates && versions) {
    return `{green-fg}No duplicate files!{/}\n\n${versions}`;
  }

  return `${duplicates}\n${versions}`;
}

module.exports = { formatProblems };
