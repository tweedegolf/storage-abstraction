import path from "path";
import { Readable } from "stream";
import slugify from "slugify";
import { IStorage, StorageConfig, StorageType } from "./types";
import { Storage } from ".";

export abstract class AbstractStorage implements IStorage {
  protected config: StorageConfig;
  protected bucketName: null | string = null;
  protected buckets: string[] = [];

  constructor(config: StorageConfig) {
    if (typeof config.bucketName !== "undefined" && config.bucketName !== null) {
      this.bucketName = slugify(config.bucketName);
    }
  }

  introspect(key?: string): StorageConfig | StorageType | string {
    if (key) {
      return this.config[key];
    }
    return this.config;
  }

  async test(): Promise<void> {
    try {
      await this.listBuckets();
    } catch (e) {
      throw new Error("Looks like the storage configuration is not correct");
    }
  }

  async addFileFromPath(origPath: string, targetPath: string): Promise<void> {
    const paths = targetPath.split("/").map(d => slugify(d));
    await this.store(origPath, path.join(...paths));
  }

  async addFileFromBuffer(buffer: Buffer, targetPath: string): Promise<void> {
    const paths = targetPath.split("/").map(d => slugify(d));
    await this.store(buffer, path.join(...paths));
  }

  async addFileFromReadable(stream: Readable, targetPath: string): Promise<void> {
    const paths = targetPath.split("/").map(d => slugify(d));
    await this.store(stream, path.join(...paths));
  }

  protected checkBucket(name: string): boolean {
    // console.log(name, this.buckets, this.buckets.indexOf(name));
    return this.buckets.indexOf(name) !== -1;
  }

  public getSelectedBucket(): string | null {
    return this.bucketName;
  }

  // stubs

  protected abstract async store(filePath: string, targetFileName: string): Promise<void>;

  protected abstract async store(buffer: Buffer, targetFileName: string): Promise<void>;

  protected abstract async store(stream: Readable, targetFileName: string): Promise<void>;

  abstract async createBucket(name: string): Promise<void>;

  abstract async selectBucket(name: string | null): Promise<void>;

  abstract async clearBucket(name?: string): Promise<void>;

  abstract async deleteBucket(name?: string): Promise<void>;

  abstract async listBuckets(): Promise<string[]>;

  abstract async getFileAsReadable(
    name: string,
    options?: { start?: number; end?: number }
  ): Promise<Readable>;

  abstract async removeFile(fileName: string): Promise<void>;

  abstract async listFiles(): Promise<[string, number][]>;

  abstract async sizeOf(name: string): Promise<number>;
}
