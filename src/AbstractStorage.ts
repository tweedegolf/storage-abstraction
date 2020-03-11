import path from "path";
import { Readable } from "stream";
import slugify from "slugify";
import { IStorage, StorageConfig } from "./types";

export abstract class AbstractStorage implements IStorage {
  public static TYPE_GOOGLE_CLOUD: string = "TYPE_GOOGLE_CLOUD";
  public static TYPE_AMAZON_S3: string = "TYPE_AMAZON_S3";
  public static TYPE_LOCAL: string = "TYPE_LOCAL";
  protected bucketName: null | string = null;
  protected buckets: string[] = [];

  constructor(config: StorageConfig) {
    if (
      typeof config.bucketName !== "undefined" &&
      config.bucketName !== null
    ) {
      this.bucketName = slugify(config.bucketName);
    }
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

  protected checkBucket(name: string): boolean {
    // console.log(name, this.buckets, this.buckets.indexOf(name));
    return this.buckets.indexOf(name) !== -1;
  }

  public getSelectedBucket(): string | null {
    return this.bucketName;
  }

  // stubs

  protected abstract async store(
    filePath: string,
    targetFileName: string
  ): Promise<void>;

  protected abstract async store(
    buffer: Buffer,
    targetFileName: string
  ): Promise<void>;

  abstract async createBucket(name: string): Promise<void>;

  abstract async selectBucket(name: string | null): Promise<void>;

  abstract async clearBucket(name?: string): Promise<void>;

  abstract async deleteBucket(name?: string): Promise<void>;

  abstract async listBuckets(): Promise<string[]>;

  abstract async getFileAsReadable(name: string): Promise<Readable>;

  abstract async getFileByteRangeAsReadable(
    name: string,
    start: number,
    length?: number
  ): Promise<Readable>;

  abstract async removeFile(fileName: string): Promise<void>;

  abstract async listFiles(): Promise<[string, number][]>;

  abstract async sizeOf(name: string): Promise<number>;
}
