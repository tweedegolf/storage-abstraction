import fs from 'fs';
import path from 'path';
import 'multer';
import { Readable } from 'stream';
import slugify from 'slugify';
import {
  IStorage,
  StorageConfig,
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

  async addFileFromPath(origPath: string, targetPath: string): Promise<boolean> {
    try {
      const paths = targetPath.split('/').map(d => slugify(d));
      await this.store(origPath, path.join(...paths));
      return true;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async addFileFromBuffer(buffer: Buffer, targetPath: string): Promise<boolean> {
    try {
      const paths = targetPath.split('/').map(d => slugify(d));
      await this.storeBuffer(buffer, path.join(...paths));
      return true;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  protected checkBucket(name?: string): void {
    if (typeof name !== 'undefined' && name !== this.bucketOrigName) {
      this.bucketOrigName = name;
      this.bucketName = slugify(name);
      this.bucketCreated = false;
    }
  }

  // stubs

  protected abstract async store(filePath: string, targetFileName: string): Promise<boolean>;

  protected abstract async storeBuffer(buffer: Buffer, targetFileName: string): Promise<boolean>;

  abstract async createBucket(name?: string): Promise<boolean>;

  abstract async clearBucket(name?: string): Promise<boolean>;

  abstract async deleteBucket(name?: string): Promise<boolean>;

  abstract async getFileAsReadable(name: string): Promise<Readable>;

  abstract async removeFile(fileName: string): Promise<boolean>;

  abstract async listFiles(): Promise<[string, number][]>;
}
