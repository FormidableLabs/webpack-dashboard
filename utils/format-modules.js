"use strict";

const path = require("path");
const _ = require("lodash/fp");
const filesize = require("filesize");
const chalk = require("chalk");

const PERCENT_MULTIPLIER = 100;
const PERCENT_PRECISION = 3;
const SCOPED_PACKAGE_INDEX = 2;

function formatModulePercentage(module, bundle) {
  const moduleSize = _.get("size.minGz")(module);
  const bundleSize = _.get("metrics.meta.bundle.minGz")(bundle);
  if (!moduleSize || !bundleSize) {
    return "--";
  }
  const percentage = (moduleSize / bundleSize * PERCENT_MULTIPLIER)
    .toPrecision(PERCENT_PRECISION);
  return `${percentage}%`;
}

function getModuleName(module) {
  // Support scoped packages
  if (module.baseName.indexOf("@") === 0) {
    return module.baseName.split("/")
      .slice(0, SCOPED_PACKAGE_INDEX)
      .reduce((x, y) => x + y);
  }
  return module.baseName.split("/")[0];
}

function getModuleNameWithVersion(module) {
  const moduleName = getModuleName(module);
  try {
    const moduleMain = require.resolve(moduleName);
    // eslint-disable-next-line global-require
    const version = require(
      path.join(
        moduleMain.substring(0, moduleMain.lastIndexOf("/")),
        "package.json"
      )
    ).version;
    return `${moduleName}@${version}`;
  } catch (err) {
    return moduleName;
  }
}

function groupModules(bundle) {
  return _.flow(
    _.filter(module => module.type === "code"),
    _.groupBy(getModuleName),
    _.toPairs,
    _.map(moduleGroupPairs => {
      const moduleGroup = _.zipObject(
        ["baseName", "children"],
        moduleGroupPairs
      );
      return Object.assign({}, moduleGroup, {
        size: {
          minGz: moduleGroup.children
            .reduce((acc, module) => acc + module.size.minGz, 0)
        }
      });
    }),
    _.orderBy(_.get("size.minGz"), "desc")
  )(bundle.metrics.sizes);
}

function formatModules(bundles) {
  const bundleText = _.flatMap(bundle => {
    const header = chalk.underline(
      chalk.green(`For bundle ${bundle.path}:`)
    );
    return [[header, "", ""]].concat(
      groupModules(bundle)
        .map(moduleGroup => [
          getModuleNameWithVersion(moduleGroup),
          filesize(moduleGroup.size.minGz),
          formatModulePercentage(moduleGroup, bundle)
        ])
    );
  })(bundles);

  return [["Name", "Size (min+gz)", "Percentage"]].concat(bundleText);
}

module.exports = formatModules;
