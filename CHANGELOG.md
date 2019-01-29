# Change Log

This project adheres to [Semantic Versioning](http://semver.org/).  
Every release, along with the migration instructions, is documented on the Github [Releases](https://github.com/FormidableLabs/webpack-dashboard/releases) page.

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