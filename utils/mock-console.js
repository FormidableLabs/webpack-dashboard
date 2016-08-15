"use strict";

module.exports = function(handler) {
  return {
    log: handler,
    info: handler,
    error: handler,
    warn: handler
  };
}
