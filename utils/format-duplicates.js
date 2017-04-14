"use strict";
const _ = require("lodash/fp");
const chalk = require("chalk");
const filesize = require("filesize");
const Handlebars = require("handlebars");

Handlebars.registerHelper("filesize", function (options) {
  // eslint-disable-next-line no-invalid-this
  return filesize(options.fn(this));
});

const template = Handlebars.compile(
`${chalk.yellow(chalk.underline("Duplicate files"))}

{{#each duplicates}}
{{@key}}:
  {{#each summary}}
  {{source}}
  {{/each}}

  Wasted bytes (min+gz): {{#filesize}}{{size.minGzExtra}}{{/filesize}}
{{/each}}

Total files with duplicates: {{total.numFilesExtra}}
Total duplicate files: {{total.numFilesWithDuplicates}}
Total wasted bytes (min+gz): {{#filesize}}{{total.size.minGzExtra}}{{/filesize}}
`);

function formatDuplicates(duplicates) {
  return _.get("meta.numFilesExtra")(duplicates) &&
    template({
      total: duplicates.meta,
      duplicates: _.omit("meta")(duplicates)
    }) || "";
}

module.exports = formatDuplicates;
