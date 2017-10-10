"use strict";

const base = require("../base.spec");

const cli = require("../../bin/webpack-dashboard");

describe("bin/webpack-dashboard", () => {
  it("can invoke the dashboard cli", () => {
    expect(() => cli({
      argv: [],
      server: {
        on: base.sandbox.spy()
      }
    })).to.not.throw();
  });
});
