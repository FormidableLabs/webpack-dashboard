"use strict";

function colorizeAndConcat(handler, color) {
  var args = Array.prototype.slice.call(arguments, 2);
  var value = "{" + color + "-fg}";
  args.forEach(function(arg) {
    value += arg + " ";
  });
  value += "{/}\n";
  handler(value);
}

module.exports = function(handler) {
  return {
    log: colorizeAndConcat.bind(null, handler, "white"),
    info: colorizeAndConcat.bind(null, handler, "white"),
    error: colorizeAndConcat.bind(null, handler, "red"),
    warn: colorizeAndConcat.bind(null, handler, "yellow")
  };
};
