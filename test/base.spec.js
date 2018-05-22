"use strict";

/**
 * Base server unit test initialization / global before/after's.
 *
 * This file should be `require`'ed by all other test files.
 *
 * **Note**: Because there is a global sandbox server unit tests should always
 * be run in a separate process from other types of tests.
 */
const sinon = require("sinon");

const blessed = require("blessed");

const base = module.exports = {
  sandbox: null
};

beforeEach(() => {
  base.sandbox = sinon.createSandbox({
    useFakeTimers: true
  });

  // Stub out **all** of blessed so we don't end up in a terminal.
  // Blessed is a `typeof` function, so manually iterate key.s
  Object.keys(blessed)
    .filter(key => typeof blessed[key] === "function")
    .forEach(key => {
      base.sandbox.stub(blessed, key);
    });

  // Some manual hacking.
  blessed.screen.returns({
    append: () => {},
    key: () => {},
    render: () => {}
  });
});

afterEach(() => {
  base.sandbox.restore();
});
