// Type definitions for webpack-dashboard 2.x.x
// Project: https://github.com/FormidableLabs/webpack-dashboard
// Definitions by: Parker Ziegler <https://github.com/parkerziegler>
// TypeScript Version: 3.2

declare module 'webpack-dashboard/plugin' {
  interface IMessage {
    type: string;
    value: string | number | { [key: string]: any }
    error?: boolean;
  }

  interface IDashboardOptions {
    port?: number;
    host?: string;
    handler?: (dataArray: IMessage[]) => void;
  }

  class DashboardPlugin {
    constructor(options?: IDashboardOptions);
  }

  export = DashboardPlugin;
}
