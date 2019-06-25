import { Readable } from 'stream';

export namespace Storage {

  export interface IStorage {
    createBucket(name?: string): Promise<boolean>
    clearBucket(name?: string): Promise<boolean>
    addFileFromPath(filePath: string, args?: AddFileArgs): Promise<FileMetaData>
    addFileFromUpload(file: Express.Multer.File, args?: AddFileArgs): Promise<FileMetaData>
    getFileAsReadable(name: string): Promise<Readable>
    removeFile(fileName: string): Promise<boolean>
    listFiles(): Promise<[string, number?][]>
  }

  interface StorageConstructor {
    new(config: Object): IStorage;
  }

  declare var Storage: StorageConstructor;

  export type AddFileArgs = {
    dir?: string
    name?: string
    remove?: boolean
  }

  export type FileMetaData = {
    name: string,
    path: string,
    size: number,
  }

  export type ConfigAmazonS3 = {
    bucketName: string
    accessKeyId: string
    secretAccessKey: string
  }

  export type ConfigGoogleCloud = {
    bucketName: string
    projectId: string
    keyFilename: string
  }

  export type ConfigLocal = {
    bucketName: string
    directory: string
  }
}

