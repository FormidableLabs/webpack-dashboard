# webpack-dashboard

[![npm version][npm_img]][npm_site]
[![Actions Status][actions_img]][actions_site]
[![Coverage Status][cov_img]][cov_site]
[![Maintenance Status][maintenance-image]](#maintenance-status)

A CLI dashboard for your webpack dev server

### What's this all about?

When using webpack, especially for a dev server, you are probably used to seeing something like this:

![https://i.imgur.com/p1uAqkD.png](https://i.imgur.com/p1uAqkD.png)

That's cool, but it's mostly noise and scrolly and not super helpful. This plugin changes that. Now when you run your dev server, you basically work at NASA:

![https://i.imgur.com/qL6dXJd.png](https://i.imgur.com/qL6dXJd.png)

### Install

```sh
$ npm install --save-dev webpack-dashboard
# ... or ...
$ yarn add --dev webpack-dashboard
```

> ℹ️ **Note**: You can alternatively globally install the dashboard (e.g. `npm install -g webpack-dashboard`) for use with any project and everything should work the same.

### Use

**`webpack-dashboard@^3.0.0` requires Node 8 or above.** Previous versions support down to Node 6.

First, import the plugin and add it to your webpack config:

```js
// Import the plugin:
const DashboardPlugin = require("webpack-dashboard/plugin");

// Add it to your webpack configuration plugins.
module.exports = {
  // ...
  plugins: [new DashboardPlugin()];
  // ...
};
```

Then, modify your dev server start script previously looked like:

```js
"scripts": {
    "dev": "node index.js", # OR
    "dev": "webpack-dev-server", # OR
    "dev": "webpack",
}
```

You would change that to:

```js
"scripts": {
    "dev": "webpack-dashboard -- node index.js", # OR
    "dev": "webpack-dashboard -- webpack-dev-server", # OR
    "dev": "webpack-dashboard -- webpack",
}
```

Now you can just run your start script like normal, except now, you are awesome. Not that you weren't before. I'm just saying. More so.

#### Customizations

More configuration customization examples can be found in our [getting started](./docs/getting-started.md) guide.

For example, if you want to use a custom port of `webpack-dashboard` to communicate between its plugin and CLI tool, you would first set the number in the options object in webpack configuration:

```js
plugins: [new DashboardPlugin({ port: 3001 })];
```

Then, you would pass it along to the CLI to match:

```sh
$ webpack-dashboard --port 3001 -- webpack
```

> ⚠️ **Warning**: When choosing a custom port, you need to find one that is **not** already in use. You should not choose one that is being used by `webpack-dev-server` / `devServer` or any other process. Instead, pick one that is **only** for `webpack-dashboard` and pair that up in the plugin configuration and CLI port flag.

### Run it

Finally, start your server using whatever command you have set up. Either you have `npm run dev` or `npm start` pointed at `node devServer.js` or something along those lines.

Then, sit back and pretend you're an astronaut.

### Supported Operating Systems and Terminals

**macOS →**
Webpack Dashboard works in Terminal, iTerm 2, and Hyper. For mouse events, like scrolling, in Terminal you will need to ensure _View → Enable Mouse Reporting_ is enabled. This is supported in macOS El Capitan, Sierra, and High Sierra. In iTerm 2, to select full rows of text hold the <kbd>⌥ Opt</kbd> key. To select a block of text hold the <kbd>⌥ Opt</kbd> + <kbd>⌘ Cmd</kbd> key combination.

**Windows 10 →** Webpack Dashboard works in Command Prompt, PowerShell, and Linux Subsystem for Windows. Mouse events are not supported at this time, as discussed further in the documentation of the underlying terminal library we use [Blessed](https://github.com/chjj/blessed#windows-compatibility). The main log can be scrolled using the <kbd>↑</kbd>, <kbd>↓</kbd>, <kbd>Page Up</kbd>, and <kbd>Page Down</kbd> keys.

**Linux →** Webpack Dashboard has been verified in the built-in terminal app for Debian-based Linux distributions such as Ubuntu or Mint. Mouse events and scrolling are supported automatically. To highlight or select lines hold the <kbd>⇧ Shift</kbd> key.

### API

#### webpack-dashboard (CLI)

##### Options

- `-c, --color [color]` - Custom ANSI color for your dashboard
- `-m, --minimal` - Runs the dashboard in minimal mode
- `-t, --title [title]` - Set title of terminal window
- `-p, --port [port]` - Custom port for socket communication server
- `-a, --include-assets [string prefix]` - Limit display to asset names matching string prefix (option can be repeated and is concatenated to `new DashboardPlugin({ includeAssets })` options array)

##### Arguments

`[command]` - The command you want to run, i.e. `webpack-dashboard -- node index.js`

#### Webpack plugin

#### Options

- `host` - Custom host for connection the socket client
- `port` - Custom port for connecting the socket client
- `includeAssets` - Limit display to asset names matching string prefix or regex (`Array<String | RegExp>`)
- `handler` - Plugin handler method, i.e. `dashboard.setData`

_Note: you can also just pass a function in as an argument, which then becomes the handler, i.e. `new DashboardPlugin(dashboard.setData)`_

### Local Development

We've standardized our local development process for `webpack-dashboard` on using `yarn`. We recommend using `yarn 1.10.x+`, as these versions include the `integrity` checksum. The checksum helps to verify the integrity of an installed package before its code is executed. 🚀

To run this repo locally against our provided examples, take the usual steps.

```sh
yarn
yarn dev
```

We re-use a small handful of the fixtures from [`inspectpack`](https://github.com/FormidableLabs/inspectpack) so that you can work locally on the dashboard while simulating common `node_modules` dependency issues you might face in the wild. These live in `/examples`.

To change the example you're working against, simply alter the `EXAMPLE` env variable in the `dev` script in `package.json` to match the scenario you want to run in `/examples`. For example, if you want to run the `tree-shaking` example, change the `dev` script from this:

```sh
$ cross-env EXAMPLE=duplicates-esm \
  node bin/webpack-dashboard.js -- \
  webpack-cli --config examples/config/webpack.config.js --watch
```

to this:

```sh
$ cross-env EXAMPLE=tree-shaking WEBPACK_MODE=production \
  node bin/webpack-dashboard.js -- \
  webpack-cli --config examples/config/webpack.config.js --watch
```

Then just run `yarn dev` to get up and running. PRs are very much appreciated!

### Publishing

When it comes time to publish a new version of `webpack-dashboard` to `npm`, authorized users can take the following steps:

```sh
# Ensure build passes all CI checks.
git pull origin master
yarn check-ci

# Version the change. We use semantic versioning.
yarn version --<major | minor | patch>

# Publish to npm.
yarn publish

# Commit the release tag to source.
git push && git push --tags
```

Please also be sure to update `CHANGELOG.md` with release notes and draft the release on GitHub. We loosely follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) spec with categories for `Features`, `Bugs`, `Tests`, `Docs`, and `Security`. All releases should also include `Migration Instructions` for adopting the new release.

#### Credits

Module output deeply inspired by: [https://github.com/robertknight/webpack-bundle-size-analyzer](https://github.com/robertknight/webpack-bundle-size-analyzer)

Error output deeply inspired by: [https://github.com/facebookincubator/create-react-app](https://github.com/facebookincubator/create-react-app)

#### Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.

[maintenance-image]: https://img.shields.io/badge/maintenance-active-green.svg?color=brightgreen&style=flat
[npm_img]: https://img.shields.io/npm/v/webpack-dashboard.svg?style=flat
[npm_site]: https://www.npmjs.com/package/webpack-dashboard
[actions_img]: https://github.com/FormidableLabs/webpack-dashboard/workflows/CI/badge.svg
[actions_site]: https://github.com/FormidableLabs/webpack-dashboard/actions
[cov_img]: https://codecov.io/gh/FormidableLabs/webpack-dashboard/branch/master/graph/badge.svg
[cov_site]: https://codecov.io/gh/FormidableLabs/webpack-dashboard
