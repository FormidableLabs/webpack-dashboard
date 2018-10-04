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
});
