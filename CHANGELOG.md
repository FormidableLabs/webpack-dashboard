# Changelog

## 3.3.7

- Bug: Move plugin types and update to webpack v5. [#324](https://github.com/FormidableLabs/webpack-dashboard/issues/324)

## 3.3.6

- Bug: Allow socket messages to be null. [#335](https://github.com/FormidableLabs/webpack-dashboard/issues/335), [#336](https://github.com/FormidableLabs/webpack-dashboard/issues/336)

## [3.3.5] - 2021-07-12

- Chore: Update dependencies. [#333](https://github.com/FormidableLabs/webpack-dashboard/issues/333)
- Coverage: Add CodeCov stats. [#206](https://github.com/FormidableLabs/webpack-dashboard/issues/206)
- CI: Update Node matrix to 12/14/16.

## [3.3.4] - 2021-07-12

- Chore: Refactor internal stats consumption to perform `inspectpack` analysis in the main thread, without using `main` streams.
- Chore: Refactor internal handler in plugin to always be a wrapped function so that we can't accidentally have asynchronous code call the handler function after it is removed / nulled.
- Bugfix: Add message counting delayed cleanup in plugin to allow messages to drain in Dashboard. Fixes [#294](https://github.com/FormidableLabs/webpack-dashboard/issues/294).

## [3.3.3] - 2021-05-05

- Security: Update `socket.io` version to get rid of vulnerable `xmlhttprequest-ssl` package. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/325 by @texpert.

## [3.3.2] - 2021-05-05

- Empty publish.

## [3.3.1] - 2021-01-29

- Bugfix: Ensure `Status` is properly updating and reaches completion. Fixes #321

## [3.3.0] - 2021-01-21

- Add `webpack@5` support. Closes #316
- Bugfix: `webpack@5` warning message conflict. Fixes #314
- Update various production dependencies.

## [3.2.1] - 2020-08-24

- Add missing dependency on `chalk`. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/309 by @am-a.

## [3.2.0] - 2019-09-08

- Add left / right navigation keys to assets in Modules and Problems screens. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/288 by @wapgear.

## [3.1.0] - 2019-08-27

- Add `DashboardPlugin({ includeAssets: [ "stringPrefix", /regexObj/ ] })` Webpack plugin filtering option.
- Add `webpack-dashboard --include-assets stringPrefix1 -a stringPrefix2` CLI filtering option.
- Change `"mode"` SocketIO event to `"options"` as it now passes both `minimal` and `includeAssets` from CLI to the Webpack plugin.
- Fix unit tests that incorrectly relied on `.complete()` for `most` observables.
- Add additional `examples` fixture for development.

## [3.0.7] - 2019-05-15

### Features

- Very minor path normalization for displaying modules paths on Windows and Prettier fixes for Windows. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/284 by @ryan-roemer.
- Add AppVeyor for Windows builds in CI. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/284 by @ryan-roemer.

### Migration Instructions

No changes required to start using v3.0.7 🎉.

## [3.0.6] - 2019-05-09

### Features

- Prevent dashboard from spawning its own console for the child process on Windows. Closes #212. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/284 by @snack-able.

### Migration Instructions

No changes required to start using v3.0.6 🎉.

## [3.0.5] - 2019-04-24

### Features

- Use `npm-run-all` as task runner for `package.json` scripts. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/283.
- Use `test` in lieu of `test-summary` for `nyc` coverage reporting on command line. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/283.

### Security

- Address `handlebars` security vulnerability. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/282 by @juliusl.
- Address additional security vulnerabilities in `js-yaml`. Included in: https://github.com/FormidableLabs/webpack-dashboard/pull/283.

### Migration Instructions

No changes required to start using v3.0.5 🎉.

## [3.0.4] - 2019-04-24 [DEPRECATED]

`v3.0.4` was an erroneous publish.

## [3.0.3] - 2019-04-18

### Bugs

- **Socket.io disconnects / large stats object size**: Dramatically reduce the size of the webpack stats object being sent from client (webpack plugin) to server (CLI). Add client error/disconnect information for better future debugging. Original issue: https://github.com/FormidableLabs/inspectpack/issues/279 and fix: https://github.com/FormidableLabs/inspectpack/pull/281

### Migration Instructions

No changes required to start using v3.0.3 🎉.

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
