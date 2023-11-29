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
  getStorage(): any; // eslint-disable-line

  storage: any; // eslint-disable-line

  /**
   * Returns the storage type, e.g. 'gcs', 'b2', 'local' etc.
   */
  getType(): string;

  /**
   * Same as `getType` but implemented as getter
   * @returns adapter type, e.g. 'gcs', 'b2', 'local' etc.
   */
  type: string;

  /**
   * Returns configuration settings that you've provided when instantiating as an object.
   * Use this only for debugging and with great care as it may expose sensitive information.
   *
   * The object contains the key `bucketName` which is the initial value that you've set during
   * initialization.
   *
   * The object also contains the key `options` which are only the options passed in during
   * initialization; if you want all options, including the default options use `getOptions()`
   *
   * @returns adapter configuration as object
   */
  getConfiguration(): AdapterConfig;

  /**
   * Same as `getConfiguration` but implemented as getter
   * @returns adapter configuration as object
   */
  config: AdapterConfig;

  getConfigError(): string;

  configError: string;

  /**
   * Returns an object that contains both the options passed with the configuration and the
   * default options of the storage type if not overruled by the options you passed in.
   */
  // getOptions(): JSON;

  /**
   * @param name name of the bucket to create, returns "ok" once the bucket has been created but
   * also when the bucket already exists.
   * @param options: additional options for creating a bucket such as access rights
   * @returns string or error
   */
  createBucket(name: string, options?: object): Promise<ResultObject>;

  /**
   * @param name: deletes all file in the bucket.
   */
  clearBucket(name: string): Promise<ResultObject>;

  /**
   * deletes the bucket with the provided name
   * @param {string} name name of the bucket
   * @returns {Promise<ResultObject>} a promise that always resolves in a ResultObject:
   * ```typescript
   * { error: null | string, value: null | string }
   * ```
   */
  deleteBucket(name: string): Promise<ResultObject>;

  /**
   * @returns an array of the names of the buckets in this storage
   */
  listBuckets(): Promise<ResultObjectBuckets>;

  /**
   * @param {filePathParams | FileBufferParams | FileStreamParams} params related to the file to be added
   * @returns the public url to the file
   * Called internally by addFileFromPath, addFileFromBuffer and addFileFromReadable
   */
  addFile(params: FilePathParams | FileBufferParams | FileStreamParams): Promise<ResultObject>;

  /**
   * @param {FilePathParams} params object that has the following keys:
   * ```typescript
   * {
   *  bucketName: string
   *  origPath: string //path to the file that you want to add, e.g. /home/user/Pictures/image1.jpg
   *  targetPath: string //path on the storage, you can add a path or only provide name of the file
   *  options?: object
   * }
   * ```
   * @returns {ResultObject} a promise that always resolves in a ResultObject:
   * ```typescript
   * {
   *  value: string | null
   *  error: string | null
   * }
   * ```
   */
  addFileFromPath(params: FilePathParams): Promise<ResultObject>;

  /**
   * @param {FileBufferParams} params
   * @property {string} FilePath.bucketName
   * @property {Buffer} FilePath.buffer - buffer
   * @property {string} FilePath.targetPath - path on the storage, you can add a path or only provide name of the file
   * @property {object} FilePath.options
   */
  addFileFromBuffer(params: FileBufferParams): Promise<ResultObject>;

  /**
   * @param {FileStreamParams} params object that contains the following keys:
   * ```typescript
   * {
   * bucketName: string
   * readable: Readable // stream from the local file, e.g. fs.createReadStream(path)
   * targetPath: string // path on the storage, you can add a path or only provide name of the file
   * options?: object
   * }
   * ```
   * @returns {ResultObject} a promise that always resolves in a ResultObject
   * ```typescript
   * {
   *  value: string | null // if success value is the public url to the file
   *  error: string | null // if fails error is the error message
   * }
   * ```
   */
  addFileFromStream(params: FileStreamParams): Promise<ResultObject>;

  /**
   * @param bucketName name of the bucket where the file is stored
   * @param name name of the file to be returned as a readable stream
   * @param start? the byte of the file where the stream starts (default: 0)
   * @param end? the byte in the file where the stream ends (default: last byte of file)
   */
  getFileAsStream(
    bucketName: string,
    fileName: string,
    options?: {
      start?: number;
      end?: number;
    }
  ): Promise<ResultObjectStream>;

  /**
   * @param bucketName name of the bucket where the file is stored
   * @param fileName name of the file
   */
  getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject>;

  /**
   * @param {string} bucketName name of the bucket where the file is stored
   * @param {string} fileName name of the file to be removed
   * @param {boolean} [allVersions = true] in case there are more versions of this file you can choose to remove
   * all of them in one go or delete only the latest version (only if applicable such as with Backblaze B2 and S3
   * when you've enabled versioning)
   */
  removeFile(bucketName: string, fileName: string, allVersions?: boolean): Promise<ResultObject>;

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
  MINIO = "minio",
}

export interface AdapterConfig {
  type: string;
  [id: string]: any; // eslint-disable-line
  // [id: string]: number | string | boolean | number[] | string[] | boolean[] | object;
}

export interface AdapterConfigAzure extends AdapterConfig {
  accountName: string;
  accountKey?: string;
  sasToken?: string;
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
    };
  };
};

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

export type BackblazeBucketOptions = {
  bucketType: string;
};

export enum S3Compatible {
  Amazon,
  R2,
  Backblaze,
}

export type ParseUrlResult = {
  error: string | null;
  value: AdapterConfig;
};

export interface ResultObject {
  error: string | null;
  value: string | null;
}

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

export type ResultObjectStream = {
  error: string | null;
  value: Readable | null;
};

/**
 * @param bucketName name of the bucket you want to use
 * @param origPath path of the file to be copied
 * @param targetPath path to copy the file to, folders will be created automatically
 * @param options additional option such as access rights
 **/
export type FilePathParams = {
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
export type FileBufferParams = {
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
export type FileStreamParams = {
  bucketName: string;
  stream: Readable;
  targetPath: string;
  options?: object;
};

/**
 * @paramObject FilePath
 * @param {string} FilePath.bucketName
 * @param {string} FilePath.origPath - path to the file that you want to add, e.g. /home/user/Pictures/image1.jpg
 * @param {string} FilePath.targetPath - path on the storage, you can add a path or only provide name of the file
 * @param {object} FilePath.options
 * @returns {ResultObject}
 */

/**
 * @paramObject FileBufferParams
 * @param {string} FilePath.bucketName
 * @param {Buffer} FilePath.buffer - buffer
 * @param {string} FilePath.targetPath - path on the storage, you can add a path or only provide name of the file
 * @param {object} FilePath.options
 * @returns {ResultObject}
 */

/**
 * @typedef {Object} FilePathParams
 * @property {string} bucketName
 * @property {string} origPath - path to the file that you want to add, e.g. /home/user/Pictures/image1.jpg
 * @property {string} argetPath - path on the storage, you can add a path or only provide name of the file
 * @property {Object} options
 */

/**
 * @typedef {Object} ResultObject
 * @property {string | null} value
 * @property {string | null} error
 */

/**
 * Params for adding a file to the storage
 * @typedef {Object} FilePathParams
 * @property {string} bucketName
 * @property {string} origPath - path to the file that you want to add, e.g. /home/user/Pictures/image1.jpg
 * @property {string} argetPath - path on the storage, you can add a path or only provide name of the file
 * @property {Object} options
 */
