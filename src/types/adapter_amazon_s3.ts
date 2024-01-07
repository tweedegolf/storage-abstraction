import { AdapterConfig } from "./general";

export enum S3Compatible {
  Amazon,
  R2,
  Backblaze,
  Cubbit,
}

export interface AdapterConfigAmazonS3 extends AdapterConfig {
  region?: string;
  endpoint?: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  accessKeyId?: string;
  secretAccessKey?: string;
}
