import { Readable } from 'stream';

export namespace Storage {

  export interface IStorage {
    addFileFromPath(filePath: string, args?: AddArgs): Promise<ReturnArgs>
    addFileFromUpload(file: Express.Multer.File, args?: AddArgs): Promise<ReturnArgs>
    createBucket(name: string): Promise<boolean>
    getFileAsReadable(name: string): Promise<Readable>
    removeFile(fileName: string): Promise<boolean>
    listFiles(): Promise<[string, number?][]>
  }

  interface StorageConstructor {
    new(config: Object): IStorage;
  }

  declare var Storage: StorageConstructor;

  export type AddArgs = {
    dir?: string
    name?: string
    remove?: boolean
  }

  export type ReturnArgs = {
    name: string,
    path: string,
    size: number,
  }


  export type File = {
    name: string
    path: string
    type: string
  }

  export type ConfigS3 = {
    bucketName: string
    accessKeyId: string
    secretAccessKey: string
  }

  export type ConfigGoogle = {
    bucketName: string
    projectId: string
    keyFilename: string
  }

  export type ConfigLocal = {
    bucketName: string
    directory: string
  }
}

