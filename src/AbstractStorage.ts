import path from 'path';
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
  protected bucketName: null | string = null;
  protected buckets: string[] = [];

  constructor(config: StorageConfig) {
    if (typeof config.bucketName !== 'undefined') {
      this.bucketName = slugify(config.bucketName);
    }
  }

  async addFileFromPath(origPath: string, targetPath: string): Promise<boolean> {
    const paths = targetPath.split('/').map(d => slugify(d));
    await this.store(origPath, path.join(...paths));
    return true;
  }

  async addFileFromBuffer(buffer: Buffer, targetPath: string): Promise<boolean> {
    const paths = targetPath.split('/').map(d => slugify(d));
    await this.store(buffer, path.join(...paths));
    return true;
  }

  protected checkBucket(name: string): boolean {
    // console.log(name, this.buckets, this.buckets.indexOf(name));
    return this.buckets.indexOf(name) !== -1;
  }

  // stubs

  protected abstract async store(filePath: string, targetFileName: string): Promise<boolean>;

  protected abstract async store(buffer: Buffer, targetFileName: string): Promise<boolean>;

  abstract async createBucket(name: string): Promise<boolean>;

  abstract async selectBucket(name: string): Promise<boolean>;

  abstract async clearBucket(name?: string): Promise<boolean>;

  abstract async deleteBucket(name?: string): Promise<boolean>;

  abstract async listBuckets(): Promise<string[]>;

  abstract async getFileAsReadable(name: string): Promise<Readable>;

  abstract async removeFile(fileName: string): Promise<boolean>;

  abstract async listFiles(): Promise<[string, number][]>;
}
