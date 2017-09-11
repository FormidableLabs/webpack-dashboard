"use strict";

const friendlySyntaxErrorLabel = "Syntax error:";

function isLikelyASyntaxError(message) {
  return message.indexOf(friendlySyntaxErrorLabel) !== -1;
}

function formatMessage(message) {
  return message
    .replace(
      "Module build failed: SyntaxError:",
      friendlySyntaxErrorLabel
    )
    .replace(
      /Module not found: Error: Cannot resolve 'file' or 'directory'/,
      "Module not found:"
    )
    .replace(/^\s*at\s.*:\d+:\d+[\s\)]*\n/gm, "")
    .replace("./~/css-loader!./~/postcss-loader!", "");
}

function lineJoin(arr) {
  return arr.join("\n");
}

// eslint-disable-next-line max-statements
function formatOutput(stats) {
  const output = [];
  const hasErrors = stats.hasErrors();
  const hasWarnings = stats.hasWarnings();

  const json = stats.toJson();
  let formattedErrors = json.errors.map(message => {
    return `Error in ${formatMessage(message)}`;
  });
  const formattedWarnings = json.warnings.map(message => {
    return `Warning in ${formatMessage(message)}`;
  });

  if (hasErrors) {
    output.push("{red-fg}Failed to compile.{/}");
    output.push("");
    if (formattedErrors.some(isLikelyASyntaxError)) {
      formattedErrors = formattedErrors.filter(isLikelyASyntaxError);
    }
    formattedErrors.forEach(message => {
      output.push(message);
      output.push("");
    });
    return lineJoin(output);
  }

  if (hasWarnings) {
    output.push("{yellow-fg}Compiled with warnings.{/yellow-fg}");
    output.push("");
    formattedWarnings.forEach(message => {
      output.push(message);
      output.push("");
    });

    return lineJoin(output);
  }

  output.push("{green-fg}Compiled successfully!{/}");
  output.push("");

  return lineJoin(output);
}

module.exports = formatOutput;
