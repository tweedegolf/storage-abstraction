// export namespace TG {
export interface Storage {
  createBucket: (name: string) => Promise<Object | Error>
  storeFile: (file: File) => Promise<Object | Error>
  deleteFile: (file: File) => Promise<Object | Error>
}

interface StorageConstructor {
  new(config: Object): Storage;
}

declare var Storage: StorageConstructor;

export type File = {
  name: string
  path: string
  type: string
}

export type ConfigStorageS3 = {
  bucketName: string
  accessKeyId: string
  secretAccessKey: string
}

export type ConfigStorageGoogle = {
  bucketName: string
  projectId: string
  keyFilename: string
}

export type ConfigStorageLocal = {
  bucketName: string
  directory: string
}
// }

