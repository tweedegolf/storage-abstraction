import { Readable } from "stream";
import { generateSlug, slugifyPath, validateName } from "./util";
import { AdapterConfig, IStorage } from "./types";

export abstract class AbstractAdapter implements IStorage {
  // protected type: StorageType;
  protected type: string;
  protected config: AdapterConfig;
  protected bucketName: string;
  protected initialized: boolean = false;
  protected slug: boolean = true;

  getType(): string {
    return this.type;
  }

  public getConfiguration(): AdapterConfig {
    return this.config;
  }

  protected generateSlug(url: string, slug: boolean = this.slug): string {
    return generateSlug(url, slug);
  }

  protected validateName(name: string): string {
    return validateName(name);
  }

  async test(): Promise<string> {
    if (this.initialized === false) {
      return Promise.reject("storage has not been initialized yet; call Storage.init() first");
    }
    try {
      await this.listFiles();
      return Promise.resolve("ok");
    } catch (e) {
      throw new Error(`Looks like the storage configuration is not correct (${e.message})`);
    }
  }

  async addFileFromPath(origPath: string, targetPath: string): Promise<void> {
    await this.store(origPath, slugifyPath(targetPath, this.slug));
  }

  async addFileFromBuffer(buffer: Buffer, targetPath: string): Promise<void> {
    await this.store(buffer, slugifyPath(targetPath, this.slug));
  }

  async addFileFromReadable(stream: Readable, targetPath: string): Promise<void> {
    await this.store(stream, slugifyPath(targetPath, this.slug));
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
