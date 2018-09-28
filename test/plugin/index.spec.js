"use strict";

const Plugin = require("../../plugin");

describe("plugin", () => {
  let plugin;
  let pluginWithOptions;
  const options = {
    port: 3000,
    host: "111.0.2.3"
  };

  beforeEach(() => {
    plugin = new Plugin();
    pluginWithOptions = new Plugin(options);
  });

  it("can create a new plugin", () => {
    expect(plugin).to.be.ok;
  });

  describe("#host", () => {
    it("has a default host of '127.0.0.1'", () => {
      expect(plugin.host).to.equal("127.0.0.1");
    });

    context("when given option host '111.0.2.3'", () => {
      it("has host set to 111.0.2.3", () => {
        expect(pluginWithOptions.host).to.equal("111.0.2.3");
      });
    });
  });

  describe("#port", () => {
    it("has a default port of '9838'", () => {
      // eslint-disable-next-line no-magic-numbers
      expect(plugin.port).to.equal(9838);
    });
    context("when given option port '3000'", () => {
      it("has port set to 3000", () => {
        // eslint-disable-next-line no-magic-numbers
        expect(pluginWithOptions.port).to.equal(3000);
      });
    });
  });

  it("has a default handler of 'null'", () => {
    expect(plugin.handler).to.be.null;
  });

  it("has a default watching of 'false'", () => {
    expect(plugin.watching).to.be.false;
  });
});
