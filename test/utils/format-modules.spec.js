"use strict";

const { _formatFileName, _formatPercentage } = require("../../utils/format-modules");

describe("format-modules.js", () => {
  describe("#_formatFileName", () => {
    it("returns a blessed green colored file name", () => {
      const mod = {
        fileName: "foo/bar/test.js"
      };
      expect(_formatFileName(mod)).to.equal("{green-fg}./foo/bar/test.js{/}");
    });

    context("when there is a baseName", () => {
      it("returns a blessed yellow colored file name", () => {
        const mod = {
          fileName: "test.js",
          baseName: "/home/bar/test.js"
        };
        expect(_formatFileName(mod)).to.equal("{yellow-fg}test.js{/}");
      });
    });

    context("when node_modules is present in fileName", () => {
      it("returns a blessed yellow colored file name", () => {
        const mod = {
          fileName: "/node_modules/@foo/test.js",
          baseName: "/home/bar/node_modules/@foo/test.js"
        };
        expect(_formatFileName(mod)).to.equal("~/{yellow-fg}@foo{/}/{yellow-fg}test.js{/}");
      });
    });
  });

  describe("#_formatPercentage", () => {
    it("returns a precentage as a string", () => {
      // eslint-disable-next-line no-magic-numbers
      expect(_formatPercentage(30, 15)).to.equal("200%");
    });
  });
});
