import path from "path";
import { Readable } from "stream";
import { IStorage, StorageConfig, StorageType } from "./types";
import { StorageLocal } from "./StorageLocal";
import { StorageAmazonS3 } from "./StorageAmazonS3";
import { StorageGoogleCloud } from "./StorageGoogleCloud";
import { parseConfig } from "./util";

export class Storage implements IStorage {
  private storage: IStorage;

  constructor(config?: string | StorageConfig) {
    this.switchStorage(config);
  }

  introspect(key?: string): StorageConfig | string {
    return this.storage.introspect(key);
  }

  public switchStorage(args?: string | StorageConfig): void {
    const [type, config] = parseConfig(args);
    if (type === StorageType.LOCAL) {
      this.storage = new StorageLocal(config);
    } else if (type === StorageType.S3) {
      this.storage = new StorageAmazonS3(config);
    } else if (type === StorageType.GCS) {
      this.storage = new StorageGoogleCloud(config);
    }
  }

  // all methods below are implementing IStorage

  async test(): Promise<string> {
    return this.storage.test();
  }

  async addFileFromBuffer(buffer: Buffer, targetPath: string): Promise<void> {
    return this.storage.addFileFromBuffer(buffer, targetPath);
  }

  async addFileFromPath(origPath: string, targetPath: string): Promise<void> {
    return this.storage.addFileFromPath(origPath, targetPath);
  }

  async addFileFromReadable(stream: Readable, targetPath: string): Promise<void> {
    return this.storage.addFileFromReadable(stream, targetPath);
  }

  async createBucket(name?: string): Promise<void> {
    return this.storage.createBucket(name);
  }

  async clearBucket(name?: string): Promise<void> {
    return this.storage.clearBucket(name);
  }

  async deleteBucket(name?: string): Promise<void> {
    return this.storage.deleteBucket(name);
  }

  async listBuckets(): Promise<string[]> {
    return this.storage.listBuckets();
  }

  public getSelectedBucket(): string | null {
    return this.storage.getSelectedBucket();
  }

  async getFileAsReadable(
    name: string,
    options: { start?: number; end?: number } = {}
  ): Promise<Readable> {
    const { start = 0, end } = options;
    // console.log(start, end, options);
    return this.storage.getFileAsReadable(name, { start, end });
  }

  async removeFile(fileName: string): Promise<void> {
    return this.storage.removeFile(fileName);
  }

  async listFiles(numFiles?: number): Promise<[string, number][]> {
    return this.storage.listFiles(numFiles);
  }

  async selectBucket(name: string | null): Promise<void> {
    return this.storage.selectBucket(name);
  }

  async sizeOf(name: string): Promise<number> {
    return this.storage.sizeOf(name);
  }
}
