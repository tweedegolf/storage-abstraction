import fs from 'fs';
import path from 'path';
import 'multer';
import { Readable } from 'stream';
import slugify from 'slugify';
import {
  IStorage,
  StorageConfig,
  StoreFileArgs,
  FileMetaData,
} from './types';

export abstract class AbstractStorage implements IStorage {
  public static TYPE_GOOGLE_CLOUD: string = 'TYPE_GOOGLE_CLOUD';
  public static TYPE_AMAZON_S3: string = 'TYPE_AMAZON_S3';
  public static TYPE_LOCAL: string = 'TYPE_LOCAL';
  protected bucketName: string;
  protected bucketOrigName: string;
  protected bucketCreated: boolean = false;

  constructor(config: StorageConfig) {
    if (typeof config.bucketName === 'undefined') {
      throw new Error('config should define a bucket name');
    }
    this.bucketOrigName = config.bucketName;
    this.bucketName = slugify(config.bucketName);
  }

  private async copy(origPath: string, origName: string, args?: StoreFileArgs) {
    const {
      dir = null,
      name: newName = null,
      remove = false,
    } = args || {};

    try {
      const fileSize = (await fs.promises.stat(origPath)).size;
      let targetPath = '';
      let targetName = slugify(origName);
      let paths: string[] = [];
      if (newName !== null) {
        targetName = slugify(newName);
      }
      if (dir !== null) {
        paths = dir.split('/').map(d => slugify(d));
      }
      targetPath = path.join(...paths, targetName);
      console.log(targetPath, remove);
      await this.store(origPath, targetPath);
      if (remove) {
        await fs.promises.unlink(origPath);
      }
      return {
        origName,
        size: fileSize,
        path: targetPath,
      };
    } catch (e) {
      // console.error('COPY', e);
      throw new Error(e.message);
    }
  }

  async addFileFromUpload(file: Express.Multer.File, args?: StoreFileArgs): Promise<FileMetaData> {
    return this.copy(file.path, file.originalname, args);
  }

  async addFileFromPath(origPath: string, args?: StoreFileArgs): Promise<FileMetaData> {
    return this.copy(origPath, path.basename(origPath), args);
  }

  async createBucket(name?: string): Promise<boolean> {
    if (typeof name !== 'undefined' && name !== this.bucketOrigName) {
      this.bucketOrigName = name;
      this.bucketName = slugify(name);
    }
    return true;
  }

  // stubs

  protected abstract async store(filePath: string, targetFileName: string): Promise<boolean>;

  abstract async clearBucket(name?: string): Promise<boolean>;

  abstract async getFileAsReadable(name: string): Promise<Readable>;

  abstract async removeFile(fileName: string): Promise<boolean>;

  abstract async listFiles(): Promise<[string, number][]>;
}
