"use strict";

const { _getAssetSize, _getTotalSize, _printAssets } = require("../../utils/format-assets");

describe("format-assets", () => {
  describe("#_getAssetSize", () => {
    context("when asset size is present", () => {
      it("returns a readable file size as string", () => {
        const asset = {
          size: 500
        };
        expect(_getAssetSize(asset)).to.equal("500 B");
      });
    });

    context("when no asset size is present", () => {
      it("returns zero in a readable file size as string", () => {
        const asset = {
          size: undefined
        };
        expect(_getAssetSize(asset)).to.equal("0 B");
      });
    });
  });

  describe("#_getTotalSize", () => {
    it("returns a readable file size of all assets as a string", () => {
      const assets = [{ size: 500 }, { size: undefined }, { size: 1000 }];
      expect(_getTotalSize(assets)).to.equal("1.46 KB");
    });
  });

  describe("#_printAssets", () => {
    it("returns a nested array of assets information", () => {
      const assetList = [
        {
          name: "assets1",
          size: 500
        },
        {
          name: "assets2",
          size: 0
        },
        {
          name: "assets2",
          size: 500
        }
      ];

      const output = [
        ["Name", "Size"],
        ["assets1", "500 B"],
        ["assets2", "0 B"],
        ["assets2", "500 B"],
        ["Total", "1000 B"]
      ];
      expect(_printAssets(assetList)).eql(output);
    });
  });
});
