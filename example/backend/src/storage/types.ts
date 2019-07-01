import { Readable } from 'stream';

export interface IStorage {
  createBucket(name?: string): Promise<boolean>;
  clearBucket(name?: string): Promise<boolean>;
  addFileFromPath(filePath: string, args?: StoreFileArgs): Promise<FileMetaData>;
  addFileFromUpload(file: Express.Multer.File, args?: StoreFileArgs): Promise<FileMetaData>;
  getFileAsReadable(name: string): Promise<Readable>;
  removeFile(fileName: string): Promise<boolean>;
  listFiles(): Promise<[string, number?][]>;
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
