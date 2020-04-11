import path from "path";
import slugify from "slugify";
import { Readable } from "stream";
import { AdapterConfig, IStorage, JSON as TypeJSON, StorageType } from "./types";

export abstract class AbstractAdapter implements IStorage {
  protected type: StorageType;
  protected config: AdapterConfig;
  protected bucketName: string;
  protected options: TypeJSON = {};
  protected initialized: boolean = false;

  getType(): string {
    return this.type;
  }

  public getOptions(): TypeJSON {
    return this.options;
  }

  public getConfiguration(): AdapterConfig {
    return this.config;
  }

  protected generateSlug(url: string, options: TypeJSON = this.options): string {
    if (!url || url === "null" || url === "undefined") {
      return "";
    }
    // console.log("SUPER", options, url);
    if (options.slug === "true" || options.slug === true || options.slug == 1) {
      const s = slugify(url);
      // console.log("SUPER", options, url, s);
      return s;
    }
    return url;
  }

  protected validateName(name: string): string {
    if (name === null) {
      // throw new Error("Can not use `null` as bucket name");
      return "Can not use `null` as bucket name";
    }
    if (name === "null") {
      return 'Can not use "null" as bucket name';
    }
    if (name === "undefined") {
      return 'Can not use "undefined" as bucket name';
    }
    if (name === "" || typeof name === "undefined") {
      // throw new Error("Please provide a bucket name");
      return "Please provide a bucket name";
    }
    return null;
  }

  async test(): Promise<string> {
    try {
      await this.listBuckets();
      return "ok";
    } catch (e) {
      throw new Error(`Looks like the storage configuration is not correct (${e.message})`);
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

  public getSelectedBucket(): string {
    return this.bucketName;
  }

  // stubs

  protected abstract async store(filePath: string, targetFileName: string): Promise<void>;

  protected abstract async store(buffer: Buffer, targetFileName: string): Promise<void>;

  protected abstract async store(stream: Readable, targetFileName: string): Promise<void>;

  abstract async init(): Promise<boolean>;

  abstract async selectBucket(name: string | null): Promise<void>;

  abstract async createBucket(name: string): Promise<string>;

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
