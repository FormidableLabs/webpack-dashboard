"use strict";

const chalk = require("chalk");
const Handlebars = require("handlebars");

const template = Handlebars.compile(
`${chalk.yellow(chalk.underline("Version skews"))}

{{#each versions}}
{{name}}:
  {{#each versions}}
  {{@key}}:
    {{#each this}}
      - {{{this}}}
    {{/each}}
  {{/each}}
{{/each}}
`);

function formatVersions(versions) {
  return ((versions || {}).versions || []).length && template({
    versions: versions.versions
  }) || "";
}

module.exports = formatVersions;
