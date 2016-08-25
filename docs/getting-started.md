# Getting Started with Webpack-Dashboard

## Install

`npm install webpack-dashboard --save-dev`

## Use (The New Way)

***OS X Terminal.app users:*** Make sure that **View → Allow Mouse Reporting** is enabled, otherwise scrolling through logs and modules won't work. If your version of Terminal.app doesn't have this feature, you may want to check out an alternative such as [iTerm2](https://www.iterm2.com/index.html).

### package.json (recommended)

After the initial release, it was decided that running a separate process and communicating via sockets would be more efficient and solves a lot of problems with stdout.

The new way to run the dashboard is to add the plugin, and then call the provided binary.

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
Note, in the new version you don't pass the handler function to the `DashboardPlugin` constructor. Because sockets use a port, the constructor now supports passing an options object that can include a custom port (if the default is giving you problems). If using a custom port, the port number must be included in the options object here, as well as passed using the -p flag in the call to webpack-dashboard. See how below:

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

If you are using the webpack-dev-server binary, you can do something like:

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

## Use (The Old Way)

### Turn off errors

You need to turn off all error logging by setting your webpack config `quiet` option to true. If you use webpack-hot-middleware, that is done by setting the `log` option to a no-op. You can do something sort of like this, depending upon your setup:

```js
app.use(require('webpack-dev-middleware')(compiler, {
  quiet: true,
  publicPath: config.output.publicPath,
}));

app.use(require('webpack-hot-middleware')(compiler, {
  log: () => {}
}));
```

### webpack-dev-middleware

First, import the dashboard and webpack plugin:

```js
var Dashboard = require('webpack-dashboard');
var DashboardPlugin = require('webpack-dashboard/plugin');
```

Next, right after you create your compiler, create an instance of the dashboard and apply the plugin, like so:

```js
var compiler = webpack(config);

var dashboard = new Dashboard();

compiler.apply(new DashboardPlugin(dashboard.setData));
```

### webpack-dev-server

If you are running the dev server without an express server, you'll have to initialize the dashboard in your `webpack.config.js`.

First, import the dashboard and plugin, and create a new instance of the dashboard:

```js
var Dashboard = require('webpack-dashboard');
var DashboardPlugin = require('webpack-dashboard/plugin');
var dashboard = new Dashboard();
```

Then, in your config under `plugins`, add:

```js
new DashboardPlugin(dashboard.setData)
```

Ensure you've set `quiet: true` in your WebpackDevServer constructor:

```js
new WebpackDevServer(
  Webpack(settings),
  {
    publicPath: settings.output.publicPath,
    hot: true,
    quiet: true, // lets WebpackDashboard do its thing
    historyApiFallback: true,
  }
).listen(
```

### Run it

Finally, start your server using whatever command you have set up. Either you have `npm run dev` or `npm start` pointed at `node devServer.js` or something along those lines.

Then, sit back and pretend you're an astronaut.