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

interface ICompiler {
  hooks?: any;
  plugin?: (name: string, callback: () => void) => void;
}

export default class DashboardPlugin {
  constructor(options?: IDashboardOptions);
  apply(compiler: ICompiler): void;
}
