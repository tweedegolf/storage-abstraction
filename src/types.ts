import { Readable } from 'stream';

export interface IStorage {
  /**
   * @param name?: name of the bucket to create or to use is the bucket already exists. Note that
   * the provided name will be slugified
   */
  createBucket(name?: string): Promise<boolean>;

  /**
   * @param name?: deletes all file in the bucket. If no name is provided the default bucket of the
   * current storage will be emtied.
   */
  clearBucket(name?: string): Promise<boolean>;

  /**
   * @param filePath: path to the file to be copied
   * @param config?: setting for processing this file by the permanent storage
   * @param config.dir?: the directory to save this file into, directory will be created if it doesn't exist
   * @param config.newName?: the name of the file in the storage
   * @param config.remove?: whether or not to remove the file after it has been copied to the storage
   */
  addFileFromPath(filePath: string, args?: StoreFileArgs): Promise<FileMetaData>;

  /**
   * @param tempFile: temporary Multer file
   * @param config?: setting for processing this file by the permanent storage
   * @param config.dir?: the directory to save this file into, directory will be created if it doesn't exist
   * @param config.newName?: the name of the file in the storage
   * @param config.remove?: whether or not to remove the temp file after it has been stored
   */
  addFileFromUpload(file: Express.Multer.File, args?: StoreFileArgs): Promise<FileMetaData>;

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

export type StoreFileArgs = {
  dir?: string,
  name?: string,
  remove?: boolean,
};

export type FileMetaData = {
  origName: string,
  path: string,
  size: number,
};

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
