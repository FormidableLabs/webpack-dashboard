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
    append: sinon.spy(),
    key: sinon.spy(),
    render: sinon.spy()
  });

  blessed.listbar.returns({
    selected: "selected",
    setLabel: sinon.spy(),
    setProblems: sinon.spy(),
    selectTab: sinon.spy(),
    setItems: sinon.spy()
  });

  blessed.box.returns({
    setContent: sinon.spy(),
    setLabel: sinon.spy()
  });

  blessed.log.returns({
    log: sinon.spy()
  });

  blessed.table.returns({
    setData: sinon.spy()
  });

  blessed.ProgressBar.returns({
    setContent: sinon.spy(),
    setProgress: sinon.spy()
  });
});

afterEach(() => {
  base.sandbox.restore();
});
