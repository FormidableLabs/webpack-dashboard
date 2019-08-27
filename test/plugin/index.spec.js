"use strict";

const inspectpack = require("inspectpack");

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
      stats = {
        modules: [],
        assets: []
      };
      toJson = base.sandbox.stub().callsFake(() => stats);
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

      return (
        plugin
          .observeMetrics({ toJson })
          .drain()
          // eslint-disable-next-line promise/always-return
          .then(() => {
            expect(actions).to.have.been.calledThrice;
          })
      );
    });

    it("filters assets for includeAssets", () => {
      const actions = base.sandbox.spy(inspectpack, "actions");

      stats = {
        assets: [
          {
            name: "one.js",
            modules: []
          },
          {
            name: "two.js",
            modules: []
          },
          {
            name: "three.js",
            modules: []
          }
        ]
      };

      plugin = new Plugin({
        includeAssets: [
          "one", // string prefix
          /tw/ // regex match
        ]
      });

      return (
        plugin
          .observeMetrics({ toJson })
          .drain()
          // eslint-disable-next-line promise/always-return
          .then(() => {
            expect(actions).to.have.been.calledWith("sizes", {
              stats: {
                assets: [{ modules: [], name: "one.js" }, { modules: [], name: "two.js" }]
              }
            });
          })
      );
    });

    it("should serialize errors when encountered", () => {
      const actions = base.sandbox.stub(inspectpack, "actions").rejects();
      const serializeError = base.sandbox.spy(errorSerializer, "serializeError");

      return (
        plugin
          .observeMetrics({ toJson })
          .drain()
          // eslint-disable-next-line promise/always-return
          .then(() => {
            // All three actions called.
            expect(actions).to.have.been.calledThrice;
            // ... but since two are in Promise.all only get one rejection.
            expect(serializeError).to.have.been.calledTwice;
          })
      );
    });
  });
});
