# webpack-dashboard

A CLI dashboard for your webpack dev server

### What's this all about?

When using webpack, especially for a dev server, you are probably used to seeing something like this:

![http://i.imgur.com/p1uAqkD.png](http://i.imgur.com/p1uAqkD.png)

That's cool, but it's mostly noise and scrolly and not super helpful. This plugin changes that. Now when you run your dev server, you basically work at NASA:

![http://i.imgur.com/5BWa1hB.png](http://i.imgur.com/5BWa1hB.png)

### Install

`npm install webpack-dashboard --save-dev`

### Use

First, import the plugin and add it to your webpack config, or apply it to your compiler:

```js
// Import the plugin:
var DashboardPlugin = require('webpack-dashboard/plugin');

// If you aren't using express, add it to your webpack configs plugins section:
plugins: [
    new DashboardPlugin()
]

// If you are using an express based dev server, add it with compiler.apply
compiler.apply(new DashboardPlugin());
```
If using a custom port, the port number must be included in the options object here, as well as passed using the -p flag in the call to webpack-dashboard. See how below:

```js
plugins: [
    new DashboardPlugin({ port: 3001 })
]
```

In the latest version, you can either run your app, and run `webpack-dashboard` independently (by installing with `npm install webpack-dashboard -g`) or run webpack-dashboard from your `package.json`. So if your dev server start script previously looked like:

```js
"scripts": {
    "dev": "node index.js"
}
```

You would change that to:

```js
"scripts": {
    "dev": "webpack-dashboard -- node index.js"
}
```
Now you can just run your start script like normal, except now, you are awesome. Not that you weren't before. I'm just saying. More so.

### InspectPack and Node Environments

Webpack Dashboard does additional analysis of individual module sizes (including minified + gzipped), asset sizes, and any problems when your bundle is unminified and not in a production environment. The Webpack Plugin automatically adds `pathinfo = true` to your configuration’s output object. Environments are defined through the `DefinePlugin` with `process.env["NODE_ENV"]` being `"production"`. Webpack Dashboard will produce a warning if a production configuration is run.

#### Run it

Finally, start your server using whatever command you have set up. Either you have `npm run dev` or `npm start` pointed at `node devServer.js` or something along those lines.

Then, sit back and pretend you're an astronaut.

#### CPU usage + tips

By default, `inspectpack` produces an approximated minified + gzip size for each individual module. For large bundles, this can be very CPU intensive. While we parallelize and cache these results, if you are experiencing system slowdown from lots of Node.js processes, you can disable either minification and/or gzip approximate calculations by adding the following options to the plugin configuration:

```js
plugins: [
    new DashboardPlugin({
        minified: false,
        gzip: false
    })
]
```

It's also worth noting that under-the-hood `inspectpack` caches previous calculated results for dramatic speedups (like 50-100x faster than uncached in some instances). To enable best results, make sure that the `optionalDependencies` of `better-sqlite` and `farmhash` were installed, and the default cache file location of `${HOME}/.webpack-dashboard-cache.db` is writable by the dashboard processes.

### Supported Operating Systems and Terminals
**macOS →**
Webpack Dashboard works in Terminal, iTerm 2, and Hyper. For mouse events, like scrolling, in Terminal you will need to ensure *View → Enable Mouse Reporting* is enabled. This is supported in macOS El Capitan, Sierra, and High Sierra. In iTerm 2, to select full rows of text hold the <kbd>⌥ Opt</kbd> key. To select a block of text hold the <kbd>⌥ Opt</kbd> + <kbd>⌘ Cmd</kbd> key combination.

**Windows 10 →** Webpack Dashboard works in Command Prompt, PowerShell, and Linux Subsystem for Windows. Mouse events are not supported at this time, as discussed further in the documentation of the underlying terminal library we use [Blessed](https://github.com/chjj/blessed#windows-compatibility). The main log can be scrolled using the <kbd>↑</kbd>, <kbd>↓</kbd>, <kbd>Page Up</kbd>, and <kbd>Page Down</kbd> keys.

**Linux →** Webpack Dashboard has been verified in the built-in terminal app for Debian-based Linux distributions such as Ubuntu or Mint. Mouse events and scrolling are supported automatically. To highlight or select lines hold the <kbd>⇧ Shift</kbd> key.


### API

#### webpack-dashboard (CLI)
##### Options

 - `-c, --color [color]` - Custom ANSI color for your dashboard
 - `-m, --minimal` - Runs the dashboard in minimal mode
 - `-t, --title [title]` - Set title of terminal window
 - `-p, --port [port]` - Custom port for socket communication server

##### Arguments

`[command]` - The command you want to run, i.e. `webpack-dashboard -- node index.js`

#### Webpack plugin
#### Options

 - `host` - Custom host for connection the socket client
 - `port` - Custom port for connecting the socket client
 - `root` - Custom full path to project root (where `package.json` + `node_modules` are if not in `process.cwd()`)
 - `minified` - Calculate and use minified asset sizes? (default: `true`)
 - `gzip` - Calculate and use gzipped asset sizes? True implies `minified = true`. (default: `true`)
 - `handler` - Plugin handler method, i.e. `dashboard.setData`

*Note: you can also just pass a function in as an argument, which then becomes the handler, i.e. `new DashboardPlugin(dashboard.setData)`*

#### Credits

Module output deeply inspired by: [https://github.com/robertknight/webpack-bundle-size-analyzer](https://github.com/robertknight/webpack-bundle-size-analyzer)

Error output deeply inspired by: [https://github.com/facebookincubator/create-react-app](https://github.com/facebookincubator/create-react-app)
