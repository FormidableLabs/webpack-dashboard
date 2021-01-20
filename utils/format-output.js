"use strict";

const friendlySyntaxErrorLabel = "Syntax error:";

function _isLikelyASyntaxError(message) {
  return message.indexOf(friendlySyntaxErrorLabel) !== -1;
}

function _formatMessage(message = "") {
  // Handle legacy and modern webpack shapes.
  message = typeof message.message !== "undefined" ? message.message : message;

  return message
    .replace("Module build failed: SyntaxError:", friendlySyntaxErrorLabel)
    .replace(/Module not found: Error: Cannot resolve 'file' or 'directory'/, "Module not found:")
    .replace(/^\s*at\s.*:\d+:\d+[\s\)]*\n/gm, "")
    .replace("./~/css-loader!./~/postcss-loader!", "");
}

function _lineJoin(arr) {
  return arr.join("\n");
}

// eslint-disable-next-line max-statements
function formatOutput(stats) {
  const output = [];
  const hasErrors = stats.hasErrors();
  const hasWarnings = stats.hasWarnings();

  const json = stats.toJson({
    source: true // Needed for webpack5+
  });
  let formattedErrors = json.errors.map(message => `Error in ${_formatMessage(message)}`);
  const formattedWarnings = json.warnings.map(message => `Warning in ${_formatMessage(message)}`);

  if (hasErrors) {
    output.push("{red-fg}Failed to compile.{/}");
    output.push("");
    if (formattedErrors.some(_isLikelyASyntaxError)) {
      formattedErrors = formattedErrors.filter(_isLikelyASyntaxError);
    }
    formattedErrors.forEach(message => {
      output.push(message);
      output.push("");
    });
    return _lineJoin(output);
  }

  if (hasWarnings) {
    output.push("{yellow-fg}Compiled with warnings.{/yellow-fg}");
    output.push("");
    formattedWarnings.forEach(message => {
      output.push(message);
      output.push("");
    });

    return _lineJoin(output);
  }

  output.push("{green-fg}Compiled successfully!{/}");
  output.push("");

  return _lineJoin(output);
}

module.exports = { formatOutput, _formatMessage, _isLikelyASyntaxError, _lineJoin };
