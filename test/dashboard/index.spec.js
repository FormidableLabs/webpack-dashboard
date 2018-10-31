"use strict";

require("../base.spec");

const Dashboard = require("../../dashboard");

describe("dashboard", () => {
  const options = {
    color: "red",
    minimal: true,
    title: "my-title"
  };

  it("can create a new no option dashboard", () => {
    const dashboard = new Dashboard();
    expect(dashboard).to.be.ok;
    expect(dashboard.color).to.equal("green");
    expect(dashboard.minimal).to.be.false;
    expect(dashboard.stats).to.be.null;
  });

  it("can create a new with options dashboard", () => {
    const dashboardWithOptions = new Dashboard(options);
    expect(dashboardWithOptions).to.be.ok;
    expect(dashboardWithOptions.color).to.equal("red");
    expect(dashboardWithOptions.minimal).to.be.true;
  });

  // TODO: All format functions.

  it("can format problems", () => {
    const dashboard = new Dashboard(options);

    // TODO: This doesn't work, but starting in right direction.
    // TODO GOAL: Regression test on the bad format requires.
    dashboard.setStats({
      value: {
        errors: [],
        warnings: [],
        data: {}
      }
    });
  });
});
