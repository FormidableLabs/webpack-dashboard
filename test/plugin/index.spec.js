"use strict";

const base = require("../base.spec");

const Plugin = require("../../plugin");

describe("plugin", () => {
  const options = {
    port: 3000,
    host: "111.0.2.3"
  };

  it("can create a new no option plugin", () => {
    const plugin = new Plugin();
    expect(plugin).to.be.ok;
    expect(plugin.host).to.equal("127.0.0.1");
    // eslint-disable-next-line no-magic-numbers
    expect(plugin.port).to.equal(9838);
    expect(plugin.handler).to.be.null;
    expect(plugin.watching).to.be.false;
  });

  it("can create a new with options dashboard", () => {
    const pluginWithOptions = new Plugin(options);
    expect(pluginWithOptions.host).to.equal("111.0.2.3");
    // eslint-disable-next-line no-magic-numbers
    expect(pluginWithOptions.port).to.equal(3000);
  });

  // TODO: Decide where to put this setup/teardown. Maybe in a nested describe.
  let stats;
  let toJson;
  let compilation;
  let compiler;
  beforeEach(() => {
    stats = {};
    toJson = base.sandbox.stub().returns(stats);
    compilation = {
      errors: [],
      warnings: [],
      getStats: () => ({ toJson }),
      tap: base.sandbox.stub(),
      tapAsync: base.sandbox.stub() // this is us in webpack-dashboard
    };
    compiler = {
      // TODO: ONLY WEBPACK4, but that's what we have in devDeps
      hooks: {
        compilation,
        emit: {
          intercept: base.sandbox.stub()
        },
        watchRun: {
          tapAsync: base.sandbox.stub()
        },
        run: {
          tapAsync: base.sandbox.stub()
        },
        compile: {
          tap: base.sandbox.stub()
        },
        failed: {
          tap: base.sandbox.stub()
        },
        invalid: {
          tap: base.sandbox.stub()
        },
        done: {
          tap: base.sandbox.stub()
        }
      }
    };
  });

  it("can do a basic compilation", () => {
    const plugin = new Plugin();
    plugin.apply(compiler);

    // TODO: HERE -- Try to message to observeMetrics
  });

  it("can do a basic observeMetrics", () => {
    const plugin = new Plugin();
    plugin.observeMetrics({ toJson });

    // TODO: HERE -- Add asserts (easy because not the formatting).
  });
});
