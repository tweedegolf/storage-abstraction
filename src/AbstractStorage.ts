import path from "path";
import slugify from "slugify";
import { Readable } from "stream";
import { StorageConfig, IStorage, JSON as TypeJSON } from "./types";

export abstract class AbstractStorage implements IStorage {
  protected type: string;
  protected config: StorageConfig;
  protected bucketName: string;
  protected options: TypeJSON = {};
  protected initialized: boolean = false;

  getType(): string {
    return this.type;
  }

  public getConfiguration(): StorageConfig {
    return this.config;
  }

  public getOptions(): TypeJSON {
    return this.options;
  }
  protected generateSlug(url: string): string {
    if (this.options.slug === "true" || this.options.slug === true || this.options.slug == 1) {
      // console.log("SUPER", this.options, url);
      return slugify(url);
    }
    return url;
  }

  async test(): Promise<string> {
    try {
      await this.listBuckets();
      return "ok";
    } catch (e) {
      throw new Error("Looks like the storage configuration is not correct");
    }
  }

  async addFileFromPath(origPath: string, targetPath: string): Promise<void> {
    let p = targetPath;
    if (this.options.slugify === true) {
      const paths = targetPath.split("/").map(d => slugify(d));
      p = path.join(...paths);
    }
    await this.store(origPath, p);
  }

  async addFileFromBuffer(buffer: Buffer, targetPath: string): Promise<void> {
    let p = targetPath;
    if (this.options.slugify === true) {
      const paths = targetPath.split("/").map(d => slugify(d));
      p = path.join(...paths);
    }
    await this.store(buffer, p);
  }

  async addFileFromReadable(stream: Readable, targetPath: string): Promise<void> {
    let p = targetPath;
    if (this.options.slugify === true) {
      const paths = targetPath.split("/").map(d => slugify(d));
      p = path.join(...paths);
    }
    await this.store(stream, p);
  }

  public getSelectedBucket(): string | undefined {
    return this.bucketName;
  }

  async createBucket(name: string): Promise<void> {
    if (name === null) {
      throw new Error("Can not use `null` as bucket name");
    }
    if (name === "" || typeof name === "undefined") {
      throw new Error("Please provide a bucket name");
    }
  }

  // stubs

  protected abstract async store(filePath: string, targetFileName: string): Promise<void>;

  protected abstract async store(buffer: Buffer, targetFileName: string): Promise<void>;

  protected abstract async store(stream: Readable, targetFileName: string): Promise<void>;

  abstract async init(): Promise<boolean>;

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
