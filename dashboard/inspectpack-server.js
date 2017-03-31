"use strict";

process._debugPort = 9878;

const Promise = require("bluebird");

const sizes = Promise.promisify(require("inspectpack/lib/actions/sizes"));

function sendSizes(bundles) {
  Promise.all(bundles.map(bundle =>
    sizes({
      code: bundle.source,
      format: "object",
      minified: true,
      gzip: true
    }).then(sizeMetrics => ({
      path: bundle.path,
      sizes: sizeMetrics
    }))
  ))
    .then(sizedBundles => process.send({
      type: "RECEIVE_SIZES",
      payload: sizedBundles
    }))
    .catch(error => process.send({ error }));
}

process.on("message", message => {
  switch (message.type) {
  case "REQUEST_SIZES":
    sendSizes(message.payload);
    break;
  }
});
