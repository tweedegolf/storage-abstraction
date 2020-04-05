import path from "path";
import { Readable } from "stream";
import slugify from "slugify";
import { IStorage } from "./types";

export abstract class AbstractStorage implements IStorage {
  protected type: string;
  protected bucketName: string;
  protected initialized: boolean;

  // constructor(config: StorageConfig) {
  //   if (typeof config.bucketName !== "undefined" && config.bucketName !== null) {
  //     this.bucketName = slugify(config.bucketName);
  //   }
  // }

  async test(): Promise<string> {
    try {
      await this.listBuckets();
      return "ok";
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

  public getSelectedBucket(): string | undefined {
    return this.bucketName;
  }

  // stubs

  protected abstract async store(filePath: string, targetFileName: string): Promise<void>;

  protected abstract async store(buffer: Buffer, targetFileName: string): Promise<void>;

  protected abstract async store(stream: Readable, targetFileName: string): Promise<void>;

  protected abstract checkBucket(name: string): boolean;

  abstract async init(): Promise<boolean>;

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

  abstract async fileExists(name: string): Promise<boolean>;
}
