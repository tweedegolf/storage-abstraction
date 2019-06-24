import 'multer';
import fs from 'fs';
import path from 'path';
import { StorageConfigGoogle, StorageConfigS3, StorageConfigLocal } from './types';
import { Readable } from 'stream';

export interface IStorage {
  addFileFromPath(filePath: string, newFileName?: string, remove?: boolean): Promise<number>
  addFile(file: Express.Multer.File, newFileName?: string, remove?: boolean): Promise<number>
  createBucket(name: string): Promise<boolean>
  getFileAsReadable(name: string): Promise<Readable>
  removeFile(fileName: string): Promise<boolean>
  listFiles(): Promise<[string, number?][]>
}

abstract class Storage implements IStorage {
  protected bucketName: string

  constructor(config: StorageConfigS3 | StorageConfigGoogle | StorageConfigLocal) {
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

  async addFile(file: Express.Multer.File, newFileName?: string, remove?: boolean): Promise<number> {
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