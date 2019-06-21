export interface Storage {
  createBucket: (name: string) => Promise<Object | Error>
  storeFile: (file: File) => Promise<Object | Error>
  deleteFile: (file: File) => Promise<Object | Error>
  getFilesInBucket: (name: string, maxFiles?: number) => Promise<Error | Object>
}

interface StorageConstructor {
  new(config: Object): Storage;
}

declare var Storage: StorageConstructor;

export type File = {
  name: string,
  path: string,
  type: string,
}

export type StorageConfigS3 = {
  accessKeyId: string,
  secretAccessKey: string
}

export type StorageConfigGoogle = {
  projectId: string,
  keyFilename: string
}