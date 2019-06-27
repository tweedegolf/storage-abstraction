import { Express } from 'express';
import { Readable } from 'stream';

// declare module "storage-abstraction" {
// }

declare abstract class Storage implements IStorage {
  public static TYPE_GOOGLE_CLOUD: string
  public static TYPE_AMAZON_S3: string
  public static TYPE_LOCAL: string
  public createBucket(): Promise<boolean>
  public clearBucket(): Promise<boolean>
  public addFileFromPath(path: string, args: StoreFileArgs): Promise<FileMetaData>
  public addFileFromUpload(file: Express.Multer.File, args: StoreFileArgs): Promise<FileMetaData>
  public getFileAsReadable(name: string): Promise<Readable>
  public removeFile(fileName: string): Promise<boolean>
  public listFiles(): Promise<[string, number?][]>
}

declare class StorageAmazonS3 extends Storage {
  constructor(config: ConfigAmazonS3)
}

declare class StorageGoogleCloud extends Storage {
  constructor(config: ConfigGoogleCloud)
}

declare class StorageLocal extends Storage {
  constructor(config: ConfigLocal)
}


// interface StorageConstructor {
//   new(config: Object): IStorage;
// }

// declare var Storage: StorageConstructor;

interface IStorage {
  createBucket(name?: string): Promise<boolean>
  clearBucket(name?: string): Promise<boolean>
  addFileFromPath(filePath: string, args?: StoreFileArgs): Promise<FileMetaData>
  addFileFromUpload(file: Express.Multer.File, args?: StoreFileArgs): Promise<FileMetaData>
  getFileAsReadable(name: string): Promise<Readable>
  removeFile(fileName: string): Promise<boolean>
  listFiles(): Promise<[string, number?][]>
}

type StoreFileArgs = {
  dir?: string
  name?: string
  remove?: boolean
}

type FileMetaData = {
  origName: string,
  path: string,
  size: number,
}

type ConfigAmazonS3 = {
  bucketName: string
  accessKeyId: string
  secretAccessKey: string
}

type ConfigGoogleCloud = {
  bucketName: string
  projectId: string
  keyFilename: string
}

type ConfigLocal = {
  bucketName: string
  directory: string
}
