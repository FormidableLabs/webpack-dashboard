"use strict";

const Handlebars = require("handlebars");

// From inspectpack.
const pkgNamePath = pkgParts =>
  pkgParts.reduce((m, part) => `${m}${m ? " -> " : ""}{cyan-fg}${part.name}{/}@${part.range}`, "");

Handlebars.registerHelper("skew", function (options) {
  // eslint-disable-next-line no-invalid-this
  return pkgNamePath(options.fn(this));
});

const template = Handlebars.compile(
  `{yellow-fg}{underline}Version skews{/}

{{#each packages}}
{yellow-fg}{bold}{{@key}}{/}
  {{#each this}}
  {green-fg}{{@key}}{/}
    {{#each this}}
      {{#each skews}}
    {{#skew}}{{{this}}}{{/skew}}
      {{/each}}
    {{/each}}
  {{/each}}
{{/each}}
`
);

function formatVersions(versions) {
  const haveSkews = !!Object.keys((versions || {}).packages || {}).length;
  return haveSkews ? template(versions) : "";
}

module.exports = formatVersions;
