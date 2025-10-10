import { AdapterConfig } from "./general.ts";

export interface AdapterConfigBackblazeB2 extends AdapterConfig {
  applicationKey: string;
  applicationKeyId: string;
}

export type BackblazeAxiosResponse = {
  response: {
    data: {
      code: string;
      message: string;
      status: number;
      allowed?: {
        capabilities: Array<string>;
      };
      buckets?: Array<any>; // eslint-disable-line
    };
  };
};

export type BackblazeB2Bucket = {
  accountId: string;
  bucketId: string;
  bucketInfo: object;
  bucketName: string;
  bucketType: string;
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

export type BucketB2 = {
  id: string;
  name: string;
};

export type FileB2 = {
  id: string;
  name: string;
  contentType: string;
  contentLength: number;
};

export type BackblazeBucketOptions = {
  bucketType: string;
};

export type ResultObjectBucketsB2 = {
  error: string | null;
  value: Array<BucketB2> | null;
};

export type ResultObjectBucketB2 = {
  error: string | null;
  value: BucketB2 | null;
};

export type ResultObjectFileB2 = {
  error: string | null;
  value: FileB2 | null;
};

export type ResultObjectFilesB2 = {
  error: string | null;
  value: Array<FileB2> | null;
};
