import { AdapterConfig } from "./general";

export interface AdapterConfigMinio extends AdapterConfig {
  endPoint: string;
  accessKey: string;
  secretKey: string;
  useSSL?: boolean;
  port?: number;
}
