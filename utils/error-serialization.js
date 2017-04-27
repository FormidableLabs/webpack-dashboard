"use strict";

const serializeError = err => ({
  code: err.code,
  message: err.message,
  stack: err.stack
});

const deserializeError = serializedError => {
  const err = new Error();
  err.code = serializedError.code;
  err.message = serializedError.message;
  err.stack = serializedError.stack;
  return err;
};

module.exports = {
  serializeError,
  deserializeError
};
