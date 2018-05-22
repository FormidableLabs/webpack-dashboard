"use strict";
const _ = require("lodash/fp");
const chalk = require("chalk");
const filesize = require("filesize");
const Handlebars = require("handlebars");

Handlebars.registerHelper("filesize", function (options) {
  // eslint-disable-next-line no-invalid-this
  return filesize(options.fn(this));
});

// TODO:
// {{#each file}}
//   {{source}}
//   {{/each}}

const template = Handlebars.compile(
`${chalk.yellow(chalk.underline("Duplicate files"))}

{{#each files}}
{{@key}}:
  TODO

  Wasted bytes (min+gz): {{#filesize}}{{size.minGzExtra}}{{/filesize}}
{{/each}}

Extra duplicate files (unique): {{meta.extraFiles}}
Extra duplicate sources (non-unique): {{meta.extraSources.num}}
Wasted duplicate bytes (non-unique): {{meta.extraSources.bytes}}
`);

function formatDuplicates(duplicates) {
  if (!duplicates || !Object.keys(duplicates.files).length) {
    return "";
  }

  const { meta, files } = duplicates;

  return "TODO_DUPLICATES";

  // TODO
  // template({
  //   meta,
  //   files
  // });
}

module.exports = formatDuplicates;
