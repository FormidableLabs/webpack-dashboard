"use strict";

const _ = require("lodash/fp");

// Inspectpack friendly size getter.
const getSize = val => val && val !== "--" ? val : 0;

// Inspectpack friendly size inspector.
const hasSize = val => val !== "--" && _.isNumber(val);

module.exports = {
  getSize,
  hasSize
};
