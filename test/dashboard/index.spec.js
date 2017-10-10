"use strict";

require("../base.spec");

const Dashboard = require("../../dashboard");

describe("dashboard", () => {
  it("can create a new dashboard", () => {
    const dashboard = new Dashboard();
    expect(dashboard).to.be.ok;
  });
});
