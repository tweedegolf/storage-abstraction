import {
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectStream,
} from "./result";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./add_file_params";

// add your custom type here
export enum StorageType {
  LOCAL = "local",
  GCS = "gcs", // Google Cloud Storage
  GS = "gs", // Google Cloud Storage
  S3 = "s3", // Amazon S3
  B2 = "b2", // BackBlaze B2
  AZURE = "azure", // Azure Storage Blob
  MINIO = "minio",
}

export enum S3Type {
  AWS = "Amazon",
  BACKBLAZE = "Backblaze",
  CUBBIT = "Cubbit",
  CLOUDFLARE = "Cloudflare",
}

export interface AdapterConfig {
  bucketName?: string;
  [id: string]: any; // eslint-disable-line
}

export interface StorageAdapterConfig extends AdapterConfig {
  type: string;
}
export interface Options {
  [id: string]: any; // eslint-disable-line
}

/**
 * @param start the byte of the file where the stream starts(default: 0)
 * @param end the byte in the file where the stream ends(default: last byte of file) 
 */
export interface StreamOptions extends Options {
  start?: number;
  end?: number;
}

export interface IAdapter {
  /**
   * @returns The instance of the service client that connects to the cloud service under the hood. For instance the adapter for Amazon returns the S3Client of the AWS SDK v3.
   */
  getServiceClient(): any; // eslint-disable-line

  /**
   * `getServiceClient` implemented as getter
   * The instance of the service client that connects to the cloud service under the hood. For instance the adapter for Amazon returns the S3Client of the AWS SDK v3.
   */
  get serviceClient(): any; // eslint-disable-line

  /**
   * @returns the storage type, e.g. 'gcs', 'b2', 'local' etc.
   */
  getType(): string;

  /**
   * `getType` implemented as getter
   * The adapter type, e.g. 'gcs', 'b2', 'local' etc.
   */
  get type(): string;

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
  getConfig(): AdapterConfig;

  /**
   * `getConfiguration` implemented as getter
   * The adapter configuration as object
   */
  get config(): AdapterConfig;

  /**
   * @returns the error message from the configuration parser or `null`. 
   */
  getConfigError(): string | null;

  /**
   * `getConfigError` implemented as getter
   * The error message from the configuration parser or `null`. 
   */
  get configError(): string | null;

  /**
   * @returns The name of the selected bucket or `null` if no bucket is selected.
   */
  getSelectedBucket(): string | null;

  /**
   * `getSelectedBucket` implemented as getter
   * The name of the selected bucket or `null` if no bucket is selected.
   */
  get selectedBucket(): string | null;

  /**
   * Stores the name of a bucket. The name of the bucket will be accessible using `getSelectedBucket` or the getter `selectedBucket`. By setting a selected bucket you can omit the `bucketName` parameter in all methods that otherwise require this parameter
   * @param bucketName the name of the bucket, if you pass `null` the currently selected bucket will be deselected
   */
  setSelectedBucket(bucketName: string | null): void;

  /**
   * Stores the name of a bucket. The name of the bucket will be accessible using `getSelectedBucket` or the getter `selectedBucket`. By setting a selected bucket you can omit the `bucketName` parameter in all methods that otherwise require this parameter
   * @param bucketName the name of the bucket, if you pass `null` the currently selected bucket will be deselected
  */
  set selectedBucket(bucketName: string | null);

  /**
   * short version of `getSelectedBucket`
   * The name of the selected bucket or `null` if no bucket is selected.
   */
  get bucketName(): string | null;

  /**
   * @description short version of `setSelectedBucket`
   * @description Stores the name of a bucket. The name of the bucket will be accessible using `getSelectedBucket` or the getter `selectedBucket`. By setting a selected bucket you can omit the `bucketName` parameter in all methods that otherwise require this parameter
   * @param name the name of the bucket, if you pass `null` the currently selected bucket will be deselected
   */
  set bucketName(name: null | string)

  /**
   * @promise CreateBucketPromise
   * @fulfill {ResultObject} `{value: "ok"}` or `{error: "the generated error message"}`
   */

  /**
   * @description creates new bucket
   * @param bucketName name of the bucket to create, returns "ok" once the bucket has been created but yields an error if bucket already exists.
   * @param options additional options for creating a bucket such as access rights
   * @resolves `{value: "ok"}` or `{error: "the generated error message"}`
   */
  createBucket(...args:
    [bucketName?: string, options?: Options] |
    [options?: Options]
  ): Promise<ResultObject>;

  /**
   * @param bucketName: deletes all files in the bucket.
   */
  clearBucket(bucketName?: string): Promise<ResultObject>;

  /**
   * Deletes the bucket with the provided name. If no bucket name is provided, the selected bucket will be deleted.
   * @param {string} bucketName name of the bucket
   * @returns {Promise<ResultObject>} a promise that always resolves in a ResultObject:
   * ```typescript
   * { error: null | string, value: null | string }
   * ```
   */
  deleteBucket(bucketName?: string): Promise<ResultObject>;

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
   * @param fileName name of the file to be returned as a readable stream
   */
  getFileAsStream(...args:
    [bucketName: string, fileName: string, options?: StreamOptions] |
    [fileName: string, options?: StreamOptions]
  ): Promise<ResultObjectStream>;

  /**
   * @deprecated: use getPublicURL or getPresignedURL
   * @param bucketName name of the bucket where the file is stored
   * @param fileName name of the file
   * @param options
   */
  getFileAsURL(...args:
    [bucketName: string, fileName: string, options?: Options] |
    [fileName: string, options?: Options]
  ): Promise<ResultObject>;

  /**
   * @param bucketName name of the bucket where the file is stored
   * @param fileName name of the file
   * @param options
   */
  getPublicURL(...args:
    [bucketName: string, fileName: string, options?: Options] |
    [fileName: string, options?: Options]
  ): Promise<ResultObject>;

  /**
   * @param bucketName name of the bucket where the file is stored
   * @param fileName name of the file
   * @param options e.g. { expiresIn: 3600 }
   */
  getPresignedURL(...args:
    [bucketName: string, fileName: string, options?: Options] |
    [fileName: string, options?: Options]
  ): Promise<ResultObject>;

  /**
   * @param bucketName name of the bucket where the file is stored
   * @param fileName name of the file to be removed
   * @param allVersions in case there are more versions of this file you can choose to remove
   * all of them in one go or delete only the latest version (only if applicable such as with Backblaze B2 and S3
   * when you've enabled versioning)
   */
  removeFile(...args:
    [bucketName: string, fileName: string, allVersions?: boolean] |
    [fileName: string, allVersions?: boolean]
  ): Promise<ResultObject>;

  /**
   * @param bucketName
   * @param numFiles 
   * @returns an array of tuples containing the file path and the file size of all files in the bucket.
   */
  listFiles(...args:
    [bucketName: string, numFiles?: number] |
    [bucketName?: string] |
    [numFiles?: number]
  ): Promise<ResultObjectFiles>;

  /**
   * @param bucketName name of the bucket where the file is stored
   * @param fileName name of the file
   * @returns the size of the file in bytes
   */
  sizeOf(...args:
    [bucketName: string, fileName: string] |
    [fileName: string]
  ): Promise<ResultObjectNumber>;

  /**
   * @param bucketName name of the bucket
   * @returns boolean
   */
  bucketExists(bucketName?: string): Promise<ResultObjectBoolean>;

  /**
   * @param bucketName name of the bucket
   * @returns boolean
   */
  bucketIsPublic(bucketName?: string): Promise<ResultObjectBoolean>;

  /**
   * @param bucketName name of the bucket where the file is stored
   * @param fileName name of the file
   * @returns boolean
   */
  fileExists(...args:
    [bucketName: string, fileName: string] |
    [fileName: string]
  ): Promise<ResultObjectBoolean>;
}
