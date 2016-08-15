#webpack-dashboard

A CLI dashboard for your webpack dev server

### What's this all about?

When using webpack, especially for a dev server, you are probably used to seeing something like this:

![http://i.imgur.com/p1uAqkD.png](http://i.imgur.com/p1uAqkD.png)

That's cool, but its mostly noisy and scrolly and not super helpful. This plugin changes that. Now when you run your dev server, you basically work at NASA:

![http://i.imgur.com/5BWa1hB.png](http://i.imgur.com/5BWa1hB.png)

### Install

`npm install webpack-dashboard@* --save-dev`

### Use

You have to use webpack-dev-server programmatically, via something like express, for this to work properly.

You can see a great example of how that's done here:

[https://github.com/gaearon/react-transform-boilerplate/blob/master/devServer.js](https://github.com/gaearon/react-transform-boilerplate/blob/master/devServer.js)

You also need to turn off all error logging by setting your webpack config `quiet` option to true. If you use webpack-hot-middleware, that is done by setting the `log` option to a no-op. You can do something sort of like this, depending upon your setup:

```js
app.use(require('webpack-dev-middleware')(compiler, {
  quiet: true,
  publicPath: config.output.publicPath,
}));

app.use(require('webpack-hot-middleware')(compiler, {
  log: () => {}
}));
```

Once you have the above in place, get this going by:

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

Finally, start your server using whatever command you have set up. Either you have `npm run dev` or `npm start` pointed at `node devServer.js` or something alone those lines.

Then, sit back and pretend you're an astronaut.

#### Credits

Module output deeply inspired by: [https://github.com/robertknight/webpack-bundle-size-analyzer](https://github.com/robertknight/webpack-bundle-size-analyzer)

Error output deeply inspired by: [https://github.com/facebookincubator/create-react-app](https://github.com/facebookincubator/create-react-app)
