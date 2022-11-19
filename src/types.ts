import { Readable } from "stream";
// import { ConfigLocal } from "../adapters/local/types";
// import { ConfigBackblazeB2 } from "../adapters/backblaze/types";
// import { ConfigAmazonS3 } from "../adapters/amazon/types";
// import { ConfigGoogleCloud } from "../adapters/google/types";

export type UploadOptions = {
  gzip?: boolean;
  contentType?: string;
  metadata?: {
    [key: string]: string;
  };
};

export interface IStorage {
  /**
   * Initializes the storage. Some storage types don't need any initialization, others
   * may require async actions such as an initial authorization. Because you can't (and don't
   * want to) handle async action in the constructor all storage types have an init() method
   * that needs to be called before any other API method call
   */
  init(): Promise<boolean>;

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
   */
  getConfiguration(): AdapterConfig;

  /**
   * Returns an object that contains both the options passed with the configuration and the
   * default options of the storage type if not overruled by the options you passed in.
   */
  // getOptions(): JSON;

  /**
   * Runs a simple test to test the storage configuration: calls `listBuckets` only to check
   * if it fails and if so, it throws an error.
   */
  test(): Promise<string>;

  /**
   * @param name: name of the bucket to create, returns true once the bucket has been created but
   * also when the bucket already exists. Note that the provided name will be slugified. Also note that
   * you have to use `selectBucket` to start using the newly created bucket
   */
  createBucket(name: string): Promise<string>;

  /**
   * @param name: name of the bucket that will be used to store files, if the bucket does not exist it
   * will be created. Note that the provided name will be slugified. If you pass null, "" or no value the
   * currently selected bucket will be deselected.
   */
  selectBucket(name?: string | null): Promise<string>;

  /**
   * @param name?: deletes all file in the bucket. If no name is provided the currently selected bucket
   * of the storage will be emptied. If no bucket is selected an error will be thrown.
   */
  clearBucket(name?: string): Promise<string>;

  /**
   * @param name?: deletes the bucket with this name. If no name is provided the currently selected bucket
   * of the storage will be deleted. If no bucket is selected an error will be thrown.
   */
  deleteBucket(name?: string): Promise<string>;

  /**
   * Retrieves a list of the names of the buckets in this storage
   */
  listBuckets(): Promise<string[]>;

  /**
   * Returns the name of the currently selected bucket or an empty string ("") if no bucket has been selected yet
   */
  getSelectedBucket(): string;

  /**
   * @param origPath: path of the file to be copied
   * @param targetPath: path to copy the file to, folders will be created automatically
   */
  addFileFromPath(origPath: string, targetPath: string): Promise<void>;

  /**
   * @param buffer: file as buffer
   * @param targetPath: path to the file to save the buffer to, folders will be created automatically
   */
  addFileFromBuffer(buffer: Buffer, targetPath: string): Promise<void>;

  /**
   * @param stream: a read stream
   * @param targetPath: path to the file to save the stream to, folders will be created automatically
   */
  addFileFromReadable(stream: Readable, targetPath: string, options?: UploadOptions): Promise<void>;

  /**
   * @param name     name of the file to be returned as a readable stream
   * @param options  start: the byte of the file where the stream starts (default: 0)
   *                 end: the byte in the file where the stream ends (default: last byte of file)
   */
  getFileAsReadable(
    name: string,
    options?: {
      start?: number;
      end?: number;
    }
  ): Promise<Readable>;

  /**
   * @param name: name of the file to be removed
   */
  removeFile(name: string): Promise<string>;

  /**
   * Returns an array of tuples containing the file path and the file size of all files in the currently
   * selected bucket. If no bucket is selected an error will be thrown.
   */
  listFiles(numFiles?: number): Promise<[string, number][]>;

  /**
   * Returns the size in bytes of the file
   * @param name
   */
  sizeOf(name: string): Promise<number>;

  /**
   * Check if a file with the provided name exists
   * @param name
   */
  fileExists(name: string): Promise<boolean>;
}

export enum StorageType {
  LOCAL = "local",
  GCS = "gcs", // Google Cloud Storage
  S3 = "s3", // Amazon S3
  B2 = "b2", // BackBlaze B2
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
  slug?: boolean;
  bucketName?: string;
}

export type GenericKey = number | string | boolean | number[] | string[] | boolean[];

export interface ConfigAmazonS3 extends IAdapterConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
  endpoint?: string;
  useDualstack?: boolean;
  maxRetries?: number;
  maxRedirects?: number;
  sslEnabled?: boolean;
  [id: string]: GenericKey;
}

export interface ConfigBackblazeB2 extends IAdapterConfig {
  applicationKeyId: string;
  applicationKey: string;
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
