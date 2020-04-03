import { Readable } from "stream";

export type UploadOptions = {
  gzip?: boolean;
  contentType?: string;
  metadata?: {
    [key: string]: string;
  };
};

export interface IStorage {
  /**
   * Runs a simple test to test the storage configuration: calls `listBuckets` only to check
   * if it fails and if so, it throws an error.
   */
  test(): Promise<void>;

  /**
   * Returns an key value object that contains configuration information; can be used for
   * debugging. Sensitive data is not listed. If you provide a value for `key` only the
   * value of that will be returned
   */
  introspect(key?: string): StorageConfig | string;

  /**
   * @param name: name of the bucket to create, returns true once the bucket has been created but
   * also when the bucket already exists. Note that the provided name will be slugified. Also note that
   * you have to use `selectBucket` to start using the newly created bucket
   */
  createBucket(name: string): Promise<void>;

  /**
   * @param name: name of the bucket that will be used to store files, if the bucket does not exist it
   * will be created. Note that the provided name will be slugified. If you pass `null` the currently
   * selected bucket will be deselected.
   */
  selectBucket(name: string | null): Promise<void>;

  /**
   * @param name?: deletes all file in the bucket. If no name is provided the currently selected bucket
   * of the storage will be emptied. If no bucket is selected an error will be thrown.
   */
  clearBucket(name?: string): Promise<void>;

  /**
   * @param name?: deletes the bucket with this name. If no name is provided the currently selected bucket
   * of the storage will be deleted. If no bucket is selected an error will be thrown.
   */
  deleteBucket(name?: string): Promise<void>;

  /**
   * Retrieves a list of the names of the buckets in this storage
   */
  listBuckets(): Promise<string[]>;

  /**
   * Returns the name of the currently selected bucket or `null` if no bucket has been selected yet
   */
  getSelectedBucket(): string | null;

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
   * @param name: name of the file to be returned as a readable stream
   * @param start?: the byte of the file where the stream starts (default: 0)
   * @param end?: the byte in the file where the stream ends (default: last byte of file)
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
  removeFile(name: string): Promise<void>;

  /**
   * Returns an array of tuples containing the file path and the file size of all files in the currently
   * selected bucket. If no bucket is selected an error will be thrown.
   */
  listFiles(): Promise<[string, number][]>;

  /**
   * Returns the size in bytes of the file
   * @param name
   */
  sizeOf(name: string): Promise<number>;
}

export enum StorageType {
  GCS = "gcs",
  S3 = "s3",
  LOCAL = "local",
}

export type ConfigAmazonS3 = {
  bucketName?: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  useDualstack?: boolean;
  region?: string;
  maxRetries?: number;
  maxRedirects?: number;
  sslEnabled?: boolean;
  apiVersion?: string;
};

export type ConfigGoogleCloud = {
  bucketName?: string;
  projectId: string;
  keyFilename: string;
};

export type ConfigBackBlazeB2 = {
  bucketName?: string;
  applicationKeyId: string;
  applicationKey: string;
};

export type ConfigLocal = {
  bucketName?: string;
  directory?: string;
};

export type StorageConfig = ConfigLocal | ConfigAmazonS3 | ConfigGoogleCloud | ConfigBackBlazeB2;
