# Getting Started with Webpack-Dashboard

## Install

```sh
$ npm install --save-dev webpack-dashboard
# ... or ...
$ yarn add --dev webpack-dashboard
```

## Use

***OS X Terminal.app users:*** Make sure that **View → Allow Mouse Reporting** is enabled, otherwise scrolling through logs and modules won't work. If your version of Terminal.app doesn't have this feature, you may want to check out an alternative such as [iTerm2](https://www.iterm2.com/index.html).

First, import the plugin and add it to your webpack config:

```js
// Import the plugin:
const DashboardPlugin = require("webpack-dashboard/plugin");

// Add it to your webpack configuration plugins.
module.exports = {
  // ...
  plugins: [new DashboardPlugin({
    /* options */
  })];
  // ...
};
```

Because sockets use a port, the constructor now supports passing an options object that can include a custom port (if the default is giving you problems). If using a custom port, the port number must be included in the options object here, as well as passed using the -p flag in the call to webpack-dashboard. See how below:

```js
plugins: [
  new DashboardPlugin({ port: 3001 })
]
```

The next step, is to call webpack-dashboard from your `package.json`. So if your dev server start script previously looked like:

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

If you are using the webpack-dev-server script, you can do something like:

```js
"scripts": {
  "dev": "webpack-dashboard -- webpack-dev-server --config ./webpack.dev.js"
}
```

Again, the new version uses sockets, so if you want to use a custom port you must use the `-p` option to pass that:

```js
"scripts": {
  "dev": "webpack-dashboard -p 3001 -- node index.js"
}
```
You can also pass a supported ANSI color using the `-c` flag to custom colorize your dashboard:

```js
"scripts": {
  "dev": "webpack-dashboard -c magenta -- node index.js"
}
```
Now you can just run your start script like normal, except now, you are awesome. Not that you weren't before. I'm just saying. More so.

## Other usage

We previously provided detailed guides for integration with `webpack-dev-server` and `express`, but as both of those projects now can be entirely configuration file based, we recommend just following the [webpack development server guide](https://webpack.js.org/guides/development/) to integrate with your appropriate development server setup of choice.
