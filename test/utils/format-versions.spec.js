"use strict";

const formatVersions = require("../../utils/format-versions");

describe("format-versions", () => {
  describe("when package are present", () => {
    const data = {
      packages: {
        foo: {
          "1.1.1": [
            {
              skews: {
                parts: [
                  { name: "foo-dep", range: "^1.0.0" },
                  { name: "bar", range: "^3.0.2" }
                ]
              }
            }
          ]
        }
      }
    };

    it("should return a handlebar compile template", () => {
      const result =
        // eslint-disable-next-line max-len
        "{yellow-fg}{underline}Version skews{/}\n\n{yellow-fg}{bold}foo{/}\n  {green-fg}1.1.1{/}\n    {cyan-fg}foo-dep{/}@^1.0.0 -> {cyan-fg}bar{/}@^3.0.2\n";
      expect(formatVersions(data)).to.equal(result);
    });
  });

  describe("when packages are not present", () => {
    it("should return an empty string", () => {
      const data = {
        packages: []
      };
      expect(formatVersions(data)).to.equal("");
    });
  });
});
