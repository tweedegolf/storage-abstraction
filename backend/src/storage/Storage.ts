import 'multer';
import fs from 'fs';
import path from 'path';
import { Storage as StorageTypes } from './types';
import { Readable } from 'stream';

const defaultArgs = {
  dir: null,
  name: null,
  remove: false,
}

abstract class Storage implements StorageTypes.IStorage {
  public static TYPE_GOOGLE_CLOUD: string = 'TYPE_GOOGLE_CLOUD'
  public static TYPE_AMAZON_S3: string = 'TYPE_AMAZON_S3'
  public static TYPE_LOCAL: string = 'TYPE_LOCAL'
  protected bucketName: string

  constructor(config: StorageTypes.ConfigAmazonS3 | StorageTypes.ConfigGoogleCloud | StorageTypes.ConfigLocal) {
    // TODO: perform sanity tests?
  }

  async addFileFromUpload(file: Express.Multer.File, args?: StorageTypes.AddFileArgs): Promise<StorageTypes.FileMetaData> {
    const {
      dir,
      name: newName,
      remove,
    } = args || defaultArgs;

    try {
      const origPath = file.path;
      const origName = path.basename(origPath);
      const fileSize = (await fs.promises.stat(origPath)).size;
      let targetPath = '';
      let targetName = origName;
      if (newName !== null) {
        targetName = newName;
      }
      if (dir !== null) {
        targetPath = dir;
      }
      targetPath = path.join(targetPath, targetName);
      await this.store(origPath, targetPath);
      if (remove === true) {
        await fs.promises.unlink(file.path)
      }
      return {
        name: targetName,
        size: fileSize,
        path: targetPath,
      }
    } catch (e) {
      console.error(e);
      throw new Error(e.message);
    }
  }

  async addFileFromPath(origPath: string, args?: StorageTypes.AddFileArgs): Promise<StorageTypes.FileMetaData> {
    const {
      dir,
      name: newName,
      remove,
    } = args || defaultArgs;

    try {
      const origName = path.basename(origPath);
      const fileSize = (await fs.promises.stat(origPath)).size;
      let targetPath = '';
      let targetName = origName;
      if (newName !== null) {
        targetName = newName;
      }
      if (dir !== null) {
        targetPath = dir;
      }
      targetPath = path.join(targetPath, targetName);
      await this.store(origPath, targetPath)
      if (remove === true) {
        await fs.promises.unlink(origPath)
      }
      return {
        name: targetName,
        size: fileSize,
        path: targetPath,
      };
    } catch (e) {
      throw new Error(e.message);
    }
  }

  // stubs (to be overridden by subclasses)

  protected abstract async store(filePath: string, targetFileName: string): Promise<boolean>

  abstract async createBucket(name?: string): Promise<boolean>

  abstract async clearBucket(name?: string): Promise<boolean>

  abstract async getFileAsReadable(name: string): Promise<Readable>

  abstract async removeFile(fileName: string): Promise<boolean>

  abstract async listFiles(): Promise<[string, number?][]>
}

export {
  Storage,
}