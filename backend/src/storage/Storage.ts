import 'multer';
import fs from 'fs';
import path from 'path';
import { ConfigStorageGoogle, ConfigStorageS3, ConfigStorageLocal } from './types';
import { Readable } from 'stream';

export interface IStorage {
  addFileFromPath(filePath: string, newFileName?: string, remove?: boolean): Promise<number>
  addFileFromUpload(file: Express.Multer.File, newFileName?: string, remove?: boolean): Promise<number>
  createBucket(name: string): Promise<boolean>
  getFileAsReadable(name: string): Promise<Readable>
  removeFile(fileName: string): Promise<boolean>
  listFiles(): Promise<[string, number?][]>
}

abstract class Storage implements IStorage {
  public static TYPE_GOOGLE_CLOUD: string = 'TYPE_GOOGLE_CLOUD'
  public static TYPE_AMAZON_S3: string = 'TYPE_AMAZON_S3'
  public static TYPE_LOCAL: string = 'TYPE_LOCAL'
  protected bucketName: string

  constructor(config: ConfigStorageS3 | ConfigStorageGoogle | ConfigStorageLocal) {
    // TODO: perform sanity tests?
  }

  async addFileFromPath(filePath: string, newFileName?: string, remove?: boolean): Promise<number> {
    const fileSize = (await fs.promises.stat(filePath)).size;
    const targetFileName = newFileName || path.basename(filePath);
    try {
      await this.store(filePath, targetFileName)
      if (remove === true) {
        await fs.promises.unlink(filePath)
      }
      return fileSize;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async addFileFromUpload(file: Express.Multer.File, newFileName?: string, remove?: boolean): Promise<number> {
    const filePath = file.path;
    const fileSize = (await fs.promises.stat(filePath)).size;
    const fileName = newFileName || path.basename(filePath);

    await this.store(filePath, fileName);
    return fs.promises.unlink(file.path)
      .then(() => fileSize)
      .catch(e => {
        console.error(e);
        return null;
      })
  }

  // stubs (to be overridden by subclasses)

  protected abstract async store(filePath: string, targetFileName: string): Promise<boolean>

  abstract async createBucket(name: string): Promise<boolean>

  abstract async getFileAsReadable(name: string): Promise<Readable>

  abstract async removeFile(fileName: string): Promise<boolean>

  abstract async listFiles(): Promise<[string, number?][]>
}

export {
  Storage,
}