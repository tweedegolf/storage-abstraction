import { Readable } from 'stream';

export interface IStorage {
  /**
   * @param name: name of the bucket to create, returns true once the bucket has been created but
   * also when the bucket already exists. Note that the provided name will be slugified. Also note that
   * you have to use `selectBucket` to start using the newly created bucket
   */
  createBucket(name: string): Promise<void>;

  /**
   * @param name: name of the bucket that will be used to store files, if the bucket does not exist it
   * will be created. Note that the provided name will be slugified.
   */
  selectBucket(name: string): Promise<void>;

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
   * @param name: name of the file to be returned as a readable stream
   */
  getFileAsReadable(name: string): Promise<Readable>;

  /**
   * @param name: name of the file to be removed
   */
  removeFile(name: string): Promise<void>;

  /**
   * Returns an array of tuples containing the file path and the file size of all files in the currently
   * selected bucket. If no bucket is selected an error will be thrown.
   */
  listFiles(): Promise<[string, number][]>;
}

export type ConfigAmazonS3 = {
  bucketName?: string,
  accessKeyId: string,
  secretAccessKey: string,
};

export type ConfigGoogleCloud = {
  bucketName?: string,
  projectId: string,
  keyFilename: string,
};

export type ConfigLocal = {
  bucketName?: string,
  directory?: string,
};

export type StorageConfig =
  ConfigLocal |
  ConfigAmazonS3 |
  ConfigGoogleCloud;
