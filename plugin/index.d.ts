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

export default class DashboardPlugin {
  constructor(options?: IDashboardOptions);
}
