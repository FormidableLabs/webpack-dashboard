"use strict";

/**
 * Problem: Duplicate files (same path name) in a bundle.
 */
const chalk = require("chalk");
const filesize = require("filesize");
const Handlebars = require("handlebars");

Handlebars.registerHelper("filesize", function (options) {
  // eslint-disable-next-line no-invalid-this
  return filesize(options.fn(this));
});

/* eslint-disable max-len*/
const template = Handlebars.compile(
  `${chalk.yellow(chalk.underline("Duplicate files"))}

{{#each files}}
- ${chalk.cyan("{{@key}}")}
  (files: {{meta.extraFiles.num}}, sources: {{meta.extraSources.num}}, bytes: {{#filesize}}{{meta.extraSources.bytes}}{{/filesize}})
{{/each}}

Extra duplicate files (unique): {{meta.extraFiles.num}}
Extra duplicate sources (non-unique): {{meta.extraSources.num}}
Wasted duplicate bytes (non-unique): {{#filesize}}{{meta.extraSources.bytes}}{{/filesize}}
`);
/* eslint-enable max-len*/

function formatDuplicates(duplicates) {
  const haveDups = !!Object.keys((duplicates || {}).files || {}).length;
  return haveDups ? template(duplicates) : "";
}

module.exports = formatDuplicates;
