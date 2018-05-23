"use strict";

const chalk = require("chalk");
const Handlebars = require("handlebars");

// From inspectpack.
const pkgNamePath = pkgParts => pkgParts.reduce(
  (m, part) => `${m}${m ? " -> " : ""}${part.name}@${part.version}`,
  ""
);

Handlebars.registerHelper("skew", function (options) {
  // eslint-disable-next-line no-invalid-this
  return pkgNamePath(options.fn(this));
});

const template = Handlebars.compile(
  `${chalk.yellow(chalk.underline("Version skews"))}

{{#each packages}}
${chalk.cyan("{{@key}}")}:
  {{#each this}}
  ${chalk.yellow("{{@key}}")}
    {{#each this}}
      {{#each skews}}
    {{#skew}}{{{this}}}{{/skew}}
      {{/each}}
    {{/each}}
  {{/each}}
{{/each}}
`);

function formatVersions(versions) {
  const haveSkews = !!Object.keys((versions || {}).packages || {}).length;
  return haveSkews ? template(versions) : "";
}

module.exports = formatVersions;
