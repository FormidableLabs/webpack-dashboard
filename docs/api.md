# API

## webpack-dashboard (CLI)
## Options

 - `-c, --color [color]` - Custom ANSI color for your dashboard
 - `-m, --minimal` - Runs the dashboard in minimal mode
 - `-p, --port [port]` - Custom port for socket communication

## Arguments

`[command]` - The command you want to run, i.e. `webpack-dashboard -- node index.js`

## Webpack plugin
## Options

 - `port` - Custom port for socket communication
 - `handler` - Plugin handler method, i.e. `dashboard.setData`

*Note: you can also just pass a function in as an argument, which then becomes the handler, i.e. `new DashboardPlugin(dashboard.setData)`*