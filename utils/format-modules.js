"use strict";

const path = require("path");
const _ = require("lodash/fp");
const filesize = require("filesize");

const PERCENT_MULTIPLIER = 100;
const PERCENT_PRECISION = 3;
const SCOPED_PACKAGE_INDEX = 2;

function formatModulePercentage(module, pseudoBundleSize) {
  const moduleSize = _.get("size.minGz")(module);

  if (!moduleSize || !pseudoBundleSize) {
    return "--";
  }
  const percentage = (moduleSize / pseudoBundleSize * PERCENT_MULTIPLIER)
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
  const nameComponents = module.baseName.split(path.sep);
  if (nameComponents[0] === ".") {
    // In Webpack 3, the part of the file name we want to display is the
    // third component when split. In Webpack 2, it's the first.
    // eslint-disable-next-line no-magic-numbers
    return nameComponents[2];
  }
  return nameComponents[0];
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
  )(bundle.metrics ? bundle.metrics.sizes : []);
}

// Get the sum of all module groups' min+gz size.
// This is not equivalent to the bundle's final
// min+gz size because gzipping the entire bundle
// can compress duplicate code more efficiently.
const getPseudoBundleSize = _.flow(
  groupModules,
  _.mapValues(group =>
    group.children.reduce((total, module) =>
      total + module.size.minGz, 0
    )
  ),
  _.values,
  _.reduce((total, groupSize) => total + groupSize, 0)
);

function formatModules(bundle) {
  const bundleText = groupModules(bundle)
    .map(moduleGroup => [
      getModuleNameWithVersion(moduleGroup),
      filesize(moduleGroup.size.minGz),
      formatModulePercentage(
        moduleGroup,
        getPseudoBundleSize(bundle)
      )
    ]);

  return [["Name", "Size (min+gz)", "Percentage"]]
    .concat(bundleText);
}

module.exports = formatModules;
