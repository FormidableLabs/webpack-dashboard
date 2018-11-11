"use strict";

const { _isLikelyASyntaxError, _lineJoin, _formatMessage } = require("../../utils/format-output");

describe("format-output", () => {
  describe("#_isLikelyASyntaxError", () => {
    context("when message is a syntax error", () => {
      it("returns true", () => {
        const message = "Syntax error: missing ; before statement";
        expect(_isLikelyASyntaxError(message)).to.be.true;
      });
    });

    context("when message is a type error", () => {
      it("returns false", () => {
        const message = "Type error: null has no properties";
        expect(_isLikelyASyntaxError(message)).to.be.false;
      });
    });
  });

  describe("#_formatMessage", () => {
    it("returns a readable user friendly message", () => {
      const message1 = "Module build failed: SyntaxError: missing ; before statement";
      const message2 = "/Module not found: Error: Cannot resolve 'file' or 'directory'/";
      expect(_formatMessage(message1)).to.equal("Syntax error: missing ; before statement");
      expect(_formatMessage(message2)).to.equal("/Module not found:/");
    });
  });

  describe("#_lineJoin", () => {
    it("returns the elements of an array on a newline as a string", () => {
      const array = ["word", "word2", "word3"];
      const output = "word\nword2\nword3";
      expect(_lineJoin(array)).to.equal(output);
    });
  });
});
