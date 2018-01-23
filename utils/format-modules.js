"use strict";

const path = require("path");
const _ = require("lodash/fp");
const filesize = require("filesize");

const ipUtils = require("./inspectpack");
const getSize = ipUtils.getSize;
const hasSize = ipUtils.hasSize;

const PERCENT_MULTIPLIER = 100;
const PERCENT_PRECISION = 3;
const SCOPED_PACKAGE_INDEX = 2;

function formatModulePercentage(module, pseudoBundleSize) {
  const moduleSize = getSize(_.get("size.minGz")(module)) ||
    getSize(_.get("size.min")(module)) ||
    _.get("size.full")(module) ||
    0;

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

const checkAndGetSizeKey = (sizeKey, keyValue) => {
  if (sizeKey && sizeKey !== keyValue) {
    throw new Error(`Found ${keyValue} + other size values: ${sizeKey}`);
  }

  return keyValue;
};

function groupModules(bundle) {
  // Dynamically determine if we have min or min+gz data.
  let sizeKey;

  return _.flow(
    _.filter(module => module.type === "code"),
    _.groupBy(getModuleName),
    _.toPairs,
    _.map(moduleGroupPairs => {
      const moduleGroup = _.zipObject(
        ["baseName", "children"],
        moduleGroupPairs
      );

      // Short-circuit empty children.
      if (!moduleGroup.children.length) {
        return Object.assign({}, moduleGroup, {
          size: {}
        });
      }

      // Dynamically determine and assert on grouping size key.
      const totalSize = moduleGroup.children.reduce((acc, module) => {
        if (hasSize(module.size.minGz)) {
          sizeKey = checkAndGetSizeKey(sizeKey, "minGz");
        } else if (hasSize(module.size.min)) {
          sizeKey = checkAndGetSizeKey(sizeKey, "min");
        } else {
          sizeKey = checkAndGetSizeKey(sizeKey, "full");
        }

        return acc + (module.size[sizeKey] || 0);
      }, 0);

      if (!sizeKey) {
        throw new Error("Could not infer size key");
      }

      return Object.assign({}, moduleGroup, {
        size: {
          [sizeKey]: totalSize
        }
      });
    }),
    // Lazy evaluate because of lazy key inference.
    vals => _.orderBy(_.get(`size.${sizeKey}`), "desc")(vals)
  )(bundle.metrics ? bundle.metrics.sizes : []);
}

// Get the sum of all module groups' min+gz size.
// This is not equivalent to the bundle's final
// min+gz size because gzipping the entire bundle
// can compress duplicate code more efficiently.
const getPseudoBundleSize = _.flow(
  groupModules,
  _.mapValues(group =>
    group.children.reduce((total, module) => {
      return total + (
        getSize(module.size.minGz) ||
        getSize(module.size.min) ||
        getSize(module.size.full) ||
        0
      );
    }, 0)
  ),
  _.values,
  _.reduce((total, groupSize) => total + groupSize, 0)
);

function formatModules(bundle) {
  let sizeHeading = "Size";
  const bundleText = groupModules(bundle)
    .map(moduleGroup => {
      // Dynamically detect if have min+gz data.
      // _and_ update heading to most specific: min+gz > min > normal
      const sizeObj = moduleGroup.size;
      let size = sizeObj.full || sizeObj.size || 0;
      if (hasSize(sizeObj.minGz)) {
        size = getSize(sizeObj.minGz);
        sizeHeading = "Size (min+gz)";
      } else if (hasSize(sizeObj.min)) {
        size = getSize(sizeObj.min);
        if (sizeHeading !== "Size (min+gz)") {
          sizeHeading = "Size (min)";
        }
      }

      return [
        getModuleNameWithVersion(moduleGroup),
        filesize(size),
        formatModulePercentage(
          moduleGroup,
          getPseudoBundleSize(bundle)
        )
      ];
    });

  return [["Name", sizeHeading, "Percentage"]].concat(bundleText);
}

module.exports = formatModules;
