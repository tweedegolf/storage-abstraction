import { Readable } from 'stream';

export interface IStorage {
  /**
   * @param name?: name of the bucket to create or to use is the bucket already exists. Note that
   * the provided name will be slugified
   */
  createBucket(name?: string): Promise<boolean>;

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
   * @param filePath: path to the file to be copied
   * @param config?: setting for processing this file by the permanent storage
   * @param config.path?: the path to the file in the storage; this allows you to organize your files in subfolders in the bucket
   * @param config.newName?: the name of the file in the storage
   * @param config.remove?: whether or not to remove the file after it has been copied to the storage
   */
  addFileFromPath(origPath: string, targetPath: string): Promise<boolean>;

  /**
   * @param buffer: file as buffer
   * @param config?: setting for processing this file by the permanent storage
   * @param config.path?: the path to the file in the storage; this allows you to organize your files in subfolders in the bucket
   * @param config.newName?: the name of the file in the storage
   * @param config.remove?: whether or not to remove the temp file after it has been stored
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
