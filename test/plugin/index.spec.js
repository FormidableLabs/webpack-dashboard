"use strict";

const inspectpack = require("inspectpack");
const most = require("most");

const base = require("../base.spec");
const Plugin = require("../../plugin");
const errorSerializer = require("../../utils/error-serialization");

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

  describe("plugin methods", () => {
    let stats;
    let toJson;
    let compilation;
    let compiler;
    let plugin;

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
        // mock out webpack4 compiler, since that's what we have in devDeps
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

      plugin = new Plugin();
    });

    it("can do a basic compilation", () => {
      expect(() => plugin.apply(compiler)).to.not.throw;

      // after instantiation, test that we can hit observeMetrics
      expect(() => plugin.observeMetrics({ toJson })).to.not.throw;
    });

    it("can do a basic observeMetrics", () => {
      const actions = base.sandbox.spy(inspectpack, "actions");
      const of = base.sandbox.spy(most, "of");
      const mergeArray = base.sandbox.spy(most, "mergeArray");

      plugin.observeMetrics({ toJson }).subscribe({
        next: base.sandbox.spy(),
        error: base.sandbox.spy(),
        complete: () => {
          expect(actions).to.have.been.calledThrice;
          expect(of).to.have.been.calledTwice;
          expect(mergeArray).to.have.been.called;
        }
      });
    });

    it("should serialize errors when encountered", () => {
      base.sandbox.stub(inspectpack, "actions").rejects();
      const serializeError = base.sandbox.spy(errorSerializer, "serializeError");

      plugin.observeMetrics({ toJson }).subscribe({
        next: base.sandbox.spy(),
        error: base.sandbox.spy(),
        complete: () => {
          expect(serializeError).to.have.been.calledThrice;
        }
      });
    });
  });
});
