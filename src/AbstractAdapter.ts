import { Readable } from "stream";
import { validateName } from "./util";
import { AdapterConfig, IStorage } from "./types";

export abstract class AbstractAdapter implements IStorage {
  // protected type: StorageType;
  protected type: string;
  protected config: AdapterConfig;
  protected bucketName: string = "";
  protected initialized: boolean = false;

  getType(): string {
    return this.type;
  }

  public getConfiguration(): AdapterConfig {
    return this.config;
  }

  protected validateName(name: string): string {
    return validateName(name);
  }

  async test(): Promise<string> {
    if (this.initialized === false) {
      return Promise.reject("storage has not been initialized yet; call Storage.init() first");
    }
    if (this.bucketName) {
      try {
        await this.listFiles();
        return Promise.resolve("ok");
      } catch (e) {
        throw new Error(`Looks like the storage configuration is not correct (${e.message})`);
      }
    }
    try {
      await this.listBuckets();
      return Promise.resolve("ok");
    } catch (e) {
      throw new Error(`Looks like the storage configuration is not correct (${e.message})`);
    }
  }

  async addFileFromPath(
    origPath: string,
    targetPath: string,
    options: object = {}
  ): Promise<string> {
    return await this.store(origPath, targetPath, options);
  }

  async addFileFromBuffer(
    buffer: Buffer,
    targetPath: string,
    options: object = {}
  ): Promise<string> {
    return await this.store(buffer, targetPath, options);
  }

  async addFileFromReadable(
    stream: Readable,
    targetPath: string,
    options: object = {}
  ): Promise<string> {
    return await this.store(stream, targetPath, options);
  }

  public getSelectedBucket(): string {
    return this.bucketName;
  }

  // stubs

  protected abstract store(
    filePath: string,
    targetFileName: string,
    options: object
  ): Promise<string>;

  protected abstract store(
    buffer: Buffer,
    targetFileName: string,
    options: object
  ): Promise<string>;

  protected abstract store(
    stream: Readable,
    targetFileName: string,
    options: object
  ): Promise<string>;

  abstract init(): Promise<boolean>;

  abstract selectBucket(name: string | null): Promise<string>;

  abstract createBucket(name: string, options?: object): Promise<string>;

  abstract clearBucket(name?: string): Promise<string>;

  abstract deleteBucket(name?: string): Promise<string>;

  abstract listBuckets(): Promise<string[]>;

  abstract getFileAsReadable(
    name: string,
    options?: { start?: number; end?: number }
  ): Promise<Readable>;

  abstract removeFile(fileName: string): Promise<string>;

  abstract listFiles(): Promise<[string, number][]>;

  abstract sizeOf(name: string): Promise<number>;

  abstract fileExists(name: string): Promise<boolean>;
}
