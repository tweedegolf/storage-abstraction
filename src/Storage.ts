import { Readable } from "stream";
import {
  IStorage,
  StorageConfig,
  StorageType,
  ConfigLocal,
  ConfigGoogleCloud,
  ConfigAmazonS3,
} from "./types";
import { StorageLocal } from "./StorageLocal";
import { StorageAmazonS3 } from "./StorageAmazonS3";
import { StorageGoogleCloud } from "./StorageGoogleCloud";
import { parseUrlString } from "./util";

export class Storage implements IStorage {
  private storage: IStorage;

  constructor(config?: string | StorageConfig) {
    this.switchStorage(config);
  }

  getType(): StorageType {
    return this.storage.getType();
  }

  public switchStorage(args?: string | StorageConfig): void {
    if (typeof args === "string" || typeof args === "undefined") {
      const config = parseUrlString(args);
      const { type } = config;
      if (type === StorageType.LOCAL) {
        this.storage = new StorageLocal(config);
      } else if (type === StorageType.S3) {
        this.storage = new StorageAmazonS3(config);
      } else if (type === StorageType.GCS) {
        this.storage = new StorageGoogleCloud(config);
      } else {
        throw new Error("Not a supported configuration");
      }
    } else if ((args as ConfigLocal).directory || (args as ConfigLocal).bucketName) {
      this.storage = new StorageLocal(args as ConfigLocal);
    } else if ((args as ConfigGoogleCloud).keyFilename) {
      this.storage = new StorageGoogleCloud(args as ConfigGoogleCloud);
    } else if ((args as ConfigAmazonS3).accessKeyId && (args as ConfigAmazonS3).secretAccessKey) {
      this.storage = new StorageAmazonS3(args as ConfigAmazonS3);
    } else {
      throw new Error("Not a supported configuration");
    }
  }

  // all methods below are implementing IStorage

  async test(): Promise<void> {
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
    options: { start?: number; end?: number }
  ): Promise<Readable> {
    const { start = 0, end } = options;
    console.log(start, end);
    return this.storage.getFileAsReadable(name, { start, end });
  }

  async removeFile(fileName: string): Promise<void> {
    return this.storage.removeFile(fileName);
  }

  async listFiles(): Promise<[string, number][]> {
    return this.storage.listFiles();
  }

  async selectBucket(name: string | null): Promise<void> {
    return this.storage.selectBucket(name);
  }

  async sizeOf(name: string): Promise<number> {
    return this.storage.sizeOf(name);
  }

  async addFileFromReadStream(stream: Readable, targetPath: string): Promise<void> {
    // to be implemented
  }
}
