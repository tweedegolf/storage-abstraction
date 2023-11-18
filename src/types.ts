import { Readable } from "stream";
// import { ConfigLocal } from "../adapters/local/types";
// import { ConfigBackblazeB2 } from "../adapters/backblaze/types";
// import { ConfigAmazonS3 } from "../adapters/amazon/types";
// import { ConfigGoogleCloud } from "../adapters/google/types";

// export type UploadOptions = {
//   gzip?: boolean;
//   contentType?: string;
//   metadata?: {
//     [key: string]: string;
//   };
// };

export interface IStorage {
  /**
   * Returns the storage type, e.g. 'gcs', 'b2', 'local' etc.
   */
  getType(): string;

  /**
   * Returns configuration settings that you've provided when instantiating as an object.
   * Use this only for debugging and with great care as it may expose sensitive information.
   *
   * The object contains the key `bucketName` which is the initial value that you've set during
   * initialization; if you have selected another bucket after initialization it will still show
   * the original value. Use `getSelectedBucket()` to retrieve the current value.
   *
   * The object also contains the key `options` which are only the options passed in during
   * initialization; if you want all options, including the default options use `getOptions()`
   *
   * @returns adapter configuration as object
   */
  getConfiguration(): AdapterConfig;

  /**
   * Returns an object that contains both the options passed with the configuration and the
   * default options of the storage type if not overruled by the options you passed in.
   */
  // getOptions(): JSON;

  /**
   * @param name name of the bucket to create, returns true once the bucket has been created but
   * also when the bucket already exists. Note that you have to use `selectBucket` to start using
   * the newly created bucket.
   * @param options: additional options for creating a bucket such as access rights
   * @returns string or error
   */
  createBucket(name: string, options?: object): Promise<ResultObject>;

  /**
   * @param name: deletes all file in the bucket.
   */
  clearBucket(name: string): Promise<ResultObject>;

  /**
   * @param name: deletes the bucket with this name.
   */
  deleteBucket(name: string): Promise<ResultObject>;

  /**
   * @returns an array of the names of the buckets in this storage
   */
  listBuckets(): Promise<ResultObjectBuckets>;

  /**
   * @paramObject data about the file to be added
   * @returns the public url to the file
   */
  addFileFromPath(paramObject: FilePath): Promise<ResultObject>;

  /**
   * @paramObject data about the file to be added
   * @returns the public url to the file
   */
  addFileFromBuffer(paramObject: FileBuffer): Promise<ResultObject>;

  /**
   * @paramObject data about the file to be added
   * @returns the public url to the file
   */
  addFileFromReadable(paramObject: FileStream): Promise<ResultObject>;

  /**
   * @param bucketName name of the bucket where the file is stored
   * @param name name of the file to be returned as a readable stream
   * @param start? the byte of the file where the stream starts (default: 0)
   * @param end? the byte in the file where the stream ends (default: last byte of file)
   */
  getFileAsReadable(
    bucketName: string,
    fileName: string,
    options?: {
      start?: number;
      end?: number;
    }
  ): Promise<ResultObjectReadable>;

  /**
   * @param bucketName name of the bucket where the file is stored
   * @param fileName name of the file
   */
  getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject>;

  /**
   * @param bucketName name of the bucket where the file is stored
   * @param fileName name of the file to be removed
   */
  removeFile(bucketName: string, fileName: string): Promise<ResultObject>;

  /**
   * @param bucketName name of the bucket
   * @param numFiles optional, only works for S3 compatible storages: the maximal number of files to retrieve
   * @returns an array of tuples containing the file path and the file size of all files in the bucket.
   */
  listFiles(bucketName: string, numFiles?: number): Promise<ResultObjectFiles>;

  /**
   * @param bucketName name of the bucket where the file is stored
   * @param fileName name of the file
   * @returns the size of the file in bytes
   */
  sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;

  /**
   * @param bucketName name of the bucket
   * @returns boolean
   */
  bucketExists(bucketName: string): Promise<ResultObjectBoolean>;

  /**
   * @param bucketName name of the bucket where the file is stored
   * @param fileName name of the file
   */
  fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>;
}

export enum StorageType {
  LOCAL = "local",
  GCS = "gcs", // Google Cloud Storage
  S3 = "s3", // Amazon S3
  B2 = "b2", // BackBlaze B2
  AZURE = "azure", // Azure Storage Blob
}

export type JSON = {
  [id: string]:
    | string
    | number
    | boolean
    | string[]
    | number[]
    | boolean[]
    | { [id: string]: JSON };
};
export interface IAdapterConfig {
  // type: StorageType;
  type: string;
  skipCheck?: boolean;
  bucketName?: string;
}

export type GenericKey = number | string | boolean | number[] | string[] | boolean[];

export interface ConfigAmazonS3 extends IAdapterConfig {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  endpoint?: string;
  useDualstack?: boolean;
  maxRetries?: number;
  maxRedirects?: number;
  sslEnabled?: boolean;
  [id: string]: GenericKey;
}

export interface ConfigAzureStorageBlob extends IAdapterConfig {
  storageAccount?: string;
  accessKey?: string;
}

export interface ConfigBackblazeB2 extends IAdapterConfig {
  applicationKeyId?: string;
  applicationKey?: string;
  // [id: string]: GenericKey;
}

export interface ConfigGoogleCloud extends IAdapterConfig {
  keyFilename?: string;
  projectId?: string;
  // [id: string]: GenericKey;
}

export interface ConfigLocal extends IAdapterConfig {
  directory: string;
  mode?: number | string;
  // [id: string]: GenericKey;
}

export interface ConfigTemplate extends IAdapterConfig {
  someKey: string;
  someOtherKey: string;
  // [id: string]: GenericKey;
}

export type AdapterConfig =
  | ConfigLocal
  | ConfigAmazonS3
  | ConfigGoogleCloud
  | ConfigBackblazeB2
  | ConfigTemplate;

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

export enum S3Compatible {
  Amazon,
  R2,
  Backblaze,
}

export type ResultObject = {
  error: string | null;
  value: string | null;
};

export type ResultObjectNumber = {
  error: string | null;
  value: number | null;
};

export type ResultObjectBoolean = {
  error: string | null;
  value: boolean | null;
};

export type ResultObjectFiles = {
  error: string | null;
  value: Array<[string, number]> | null;
};

export type ResultObjectBuckets = {
  error: string | null;
  value: Array<string> | null;
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

export type ResultObjectReadable = {
  error: string | null;
  value: Readable | null;
};

/**
 * @param bucketName name of the bucket you want to use
 * @param origPath path of the file to be copied
 * @param targetPath path to copy the file to, folders will be created automatically
 * @param options additional option such as access rights
 **/
export type FilePath = {
  bucketName: string;
  origPath: string;
  targetPath: string;
  options?: object;
};

/**
 * @param bucketName name of the bucket you want to use
 * @param buffer file as buffer
 * @param targetPath path to the file to save the buffer to, folders will be created automatically
 * @param options additional option such as access rights
 **/
export type FileBuffer = {
  bucketName: string;
  buffer: Buffer;
  targetPath: string;
  options?: object;
};

/**
 * @param bucketName name of the bucket you want to use
 * @param stream a read stream
 * @param targetPath path to the file to save the stream to, folders will be created automatically
 * @param options additional option such as access rights
 **/
export type FileStream = {
  bucketName: string;
  stream: Readable;
  targetPath: string;
  options?: object;
};
