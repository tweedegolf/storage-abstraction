import fs from 'fs'
import path from 'path'
import { StorageConfigLocal } from './types';
import { Storage, IStorage } from './Storage';

export class StorageLocal extends Storage implements IStorage {
  protected bucketName: string
  private directory: string
  private storagePath: string

  constructor(config: StorageConfigLocal) {
    super(config);
    const {
      directory,
      bucketName,
    } = config;
    this.directory = directory;
    this.bucketName = bucketName;
    this.storagePath = path.join(this.directory, this.bucketName);
  }

  protected async store(filePath: string, targetFileName: string): Promise<boolean> {
    const dest = path.join(this.bucketName, targetFileName)
    return fs.promises.copyFile(filePath, dest)
      .then(() => true)
      .catch(e => {
        throw new Error(e.message);
      })
  }

  async createBucket(): Promise<any> {
    return fs.promises.stat(this.storagePath)
      .then(() => true)
      .catch(() => fs.promises.mkdir(this.storagePath, { recursive: true, mode: 0o777 }))
      .then(() => true)
      .catch(e => {
        console.log(e.message);
        throw new Error(e.message);
      })
  }

  async listFiles(numFiles: number = 1000): Promise<Array<[string, number?]>> {

  }
}

