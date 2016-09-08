/* eslint-disable */
"use strict";

var friendlySyntaxErrorLabel = 'Syntax error:';

function isLikelyASyntaxError(message) {
  return message.indexOf(friendlySyntaxErrorLabel) !== -1;
}

function formatMessage(message) {
  return message
    .replace(
      'Module build failed: SyntaxError:',
      friendlySyntaxErrorLabel
    )
    .replace(
      /Module not found: Error: Cannot resolve 'file' or 'directory'/,
      'Module not found:'
    )
    .replace(/^\s*at\s.*:\d+:\d+[\s\)]*\n/gm, '')
    .replace('./~/css-loader!./~/postcss-loader!', '');
}

function lineJoin(arr) {
  var joined = arr.join('\n');
  return joined;
};

function formatOutput(stats) {
  var output = [];
  var hasErrors = stats.hasErrors();
  var hasWarnings = stats.hasWarnings();
  if (!hasErrors && !hasWarnings) {
    output.push('{green-fg}Compiled successfully!{/}');
    output.push('');

    return lineJoin(output);
  }

  var json = stats.toJson();
  var formattedErrors = json.errors.map(function(message) {
    return 'Error in ' + formatMessage(message);
  });
  var formattedWarnings = json.warnings.map(function(message) {
    return 'Warning in ' + formatMessage(message);
  });

  if (hasErrors) {
    output.push('{red-fg}Failed to compile.{/}');
    output.push('');
    if (formattedErrors.some(isLikelyASyntaxError)) {
      formattedErrors = formattedErrors.filter(isLikelyASyntaxError);
    }
    formattedErrors.forEach(function(message) {
      output.push(message);
      output.push('');
    });
    return lineJoin(output);
  }

  if (hasWarnings) {
    output.push('{yellow-fg}Compiled with warnings.{/yellow-fg}');
    output.push('');
    formattedWarnings.forEach(function(message) {
      output.push(message);
      output.push('');
    });

    return lineJoin(output);
  }
};

module.exports = formatOutput;
