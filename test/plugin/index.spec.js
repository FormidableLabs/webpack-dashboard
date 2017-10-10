"use strict";

const base = require("../base.spec");

const InspectpackDaemon = require("inspectpack").daemon;
const Plugin = require("../../plugin");

describe("plugin", () => {
  beforeEach(() => {
    base.sandbox.stub(InspectpackDaemon, "create");
  });

  it("can create a new plugin", () => {
    const plugin = new Plugin();
    expect(plugin).to.be.ok;
  });
});
