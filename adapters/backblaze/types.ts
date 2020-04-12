import { IAdapterConfig } from "../../src/types";

export interface ConfigBackblazeB2 extends IAdapterConfig {
  applicationKeyId: string;
  applicationKey: string;
}

export type BackblazeB2Bucket = {
  accountId: "string";
  bucketId: "string";
  bucketInfo: "object";
  bucketName: "string";
  bucketType: "string";
  corsRules: string[];
  lifecycleRules: string[];
  options: string[];
  revision: number;
};

export type BackblazeB2File = {
  accountId: string;
  action: string;
  bucketId: string;
  contentLength: number;
  contentMd5: string;
  contentSha1: string;
  contentType: string;
  fileId: string;
  fileInfo: [object];
  fileName: string;
  uploadTimestamp: number;
};
