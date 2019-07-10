import { Readable } from 'stream';

export interface IStorage {
  /**
   * @param name?: name of the bucket to create, returns true once the bucket has been created but
   * also when the bucket already exists. Note that the provided name will be slugified. Also note that
   * you have to use `selectBucket` to start using the newly created bucket
   */
  createBucket(name: string): Promise<boolean>;

  /**
   * @param name?: name of the bucket to use, if the bucket does not exist it will be created.
   * Note that the provided name will be slugified.
   */
  selectBucket(name: string): Promise<boolean>;

  /**
   * @param name?: deletes all file in the bucket. If no name is provided the default bucket of the
   * current storage will be emptied.
   */
  clearBucket(name?: string): Promise<boolean>;

  /**
   * @param name?: deletes the bucket with this name. If no name is provided the default bucket of the
   * current storage will be deleted.
   */
  deleteBucket(name?: string): Promise<boolean>;

  /**
   * Gets a list of the names of the buckets in this storage
   */
  listBuckets(): Promise<string[]>;

  /**
   * @param origPath: path of the file to be copied
   * @param targetPath: path to copy the file to
   */
  addFileFromPath(origPath: string, targetPath: string): Promise<boolean>;

  /**
   * @param buffer: file as buffer
   * @param targetPath: path to the file to save the buffer to
   */
  addFileFromBuffer(buffer: Buffer, targetPath: string): Promise<boolean>;

  /**
   * @param name: name of the object (file) to be returned as a readable stream
   */
  getFileAsReadable(name: string): Promise<Readable>;

  /**
   * @param name: name of the object (file) to be removed
   */
  removeFile(name: string): Promise<boolean>;

  /**
   * Returns an array of tuples containing the file path and the file size of all files in the curren bucket
   */
  listFiles(): Promise<[string, number][]>;
}

export type ConfigAmazonS3 = {
  bucketName: string,
  accessKeyId: string,
  secretAccessKey: string,
};

export type ConfigGoogleCloud = {
  bucketName: string,
  projectId: string,
  keyFilename: string,
};

export type ConfigLocal = {
  bucketName: string,
  directory: string,
};

export type StorageConfig =
  ConfigLocal |
  ConfigAmazonS3 |
  ConfigGoogleCloud;
