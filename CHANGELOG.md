# Change Log

This project adheres to [Semantic Versioning](http://semver.org/).
Every release, along with the migration instructions, is documented on the Github [Releases](https://github.com/FormidableLabs/webpack-dashboard/releases) page.

## UNRELEASED

### Bugs

- **Socket.io disconnects / large stats object size**: Dramatically reduce the size of the webpack stats object being sent from client (webpack plugin) to server (CLI). Add client error/disconnect information for better future debugging. Original issue: https://github.com/FormidableLabs/inspectpack/issues/279 and fix: https://github.com/FormidableLabs/inspectpack/pull/281

## [3.0.2] - 2019-03-28

### Features

- Upgrade `inspectpack` dependency to handle `null` chunks. Original issue: https://github.com/FormidableLabs/inspectpack/issues/110 and upstream fix: https://github.com/FormidableLabs/inspectpack/pull/111

### Migration Instructions

No changes required to start using v3.0.2 🎉.

## [3.0.1] - 2019-03-26

### Features

- Use `process.kill` with `SIGINT` to gracefully exit the dashboard process. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/277 by @joakimbeng.
- Update dependencies to address security warnings. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/275 by @stereobooster.

### Migration Instructions

No changes required to start using v3.0.1 🎉. We do recommend adopting this patch as soon as possible to get the security upgrades.

## [3.0.0] - 2019-02-14

### Features

- Migrated from using `blessed` to [`neo-blessed`](https://github.com/embark-framework/neo-blessed) as the underlying terminal renderer. `neo-blessed` is a maintained fork of `blessed` and brings in some nice fixes for us. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/270
- Added Prettier to the codebase 🎉 Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/270

### Docs

- Added a warning about deprecation of Node 6 support. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/270

### Migration Instructions

With this release we are dropping support for Node 6 altogether. `neo-blessed` requires Node [>= 8.0.0](https://github.com/embark-framework/neo-blessed/blob/master/package.json#L38), meaning all users of the dashboard will need to run it using Node 8 or above. Previous versions of `webpack-dashboard` are still compatible with Node 6.

## [2.1.0] - 2019-01-29

### Features

- Added a few example setups to make the local development experience with `webpack-dashboard` a lot easier. Users can now clone the repo, `yarn`, and `yarn dev` to get running. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/267
- Migrated to `inspectpack@4`. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/263
- Added TypeScript defitions. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/269

### Tests

- Added regression tests to fix an unknown import issue for our `format-*` utils. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/263
- Added tests for all `Dashboard` methods. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/263

### Docs

- Added a Local Development section to the README to make it easier to contribute to `webpack-dashboard`. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/267

### Migration Instructions

No changes required to start using v2.1.0 🎉
