"use strict";

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
});
