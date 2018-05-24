"use strict";

const Plugin = require("../../plugin");

describe("plugin", () => {
  it("can create a new plugin", () => {
    const plugin = new Plugin();
    expect(plugin).to.be.ok;
  });
});
