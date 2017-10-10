"use strict";

const chai = require("chai");
const sinonChai = require("sinon-chai");

// Add chai plugins.
chai.use(sinonChai);

// Add test lib globals.
global.expect = chai.expect;
