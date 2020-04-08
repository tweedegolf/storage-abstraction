import path from "path";
import { Readable } from "stream";
import { IStorage, StorageConfig, JSON as TypeJSON } from "./types";

// add new adapter (storage type) here
const storageClasses = {
  b2: "StorageBackBlazeB2",
  s3: "StorageAmazonS3",
  gcs: "StorageGoogleCloud",
  local: "StorageLocal",
};

export class Storage implements IStorage {
  private storage: IStorage;

  constructor(config: string | StorageConfig) {
    this.switchStorage(config);
  }

  public getType(): string {
    return this.storage.getType();
  }

  public getOptions(): TypeJSON {
    return this.storage.getOptions();
  }

  public getConfiguration(): StorageConfig {
    return this.storage.getConfiguration();
  }

  public switchStorage(args: string | StorageConfig): void {
    let type: string;
    if (typeof args === "string") {
      type = args.substring(0, args.indexOf("://"));
    } else {
      type = args.type;
    }
    const name = storageClasses[type];
    // console.log(type, name);
    if (typeof name === "undefined") {
      throw new Error(
        `unsupported storage type, must be one of ${Object.keys(storageClasses).join(", ")}`
      );
    }
    const StorageClass = require(path.join(__dirname, name));
    this.storage = new StorageClass[storageClasses[type]](args);
  }

  // all methods below are implementing IStorage

  async init(): Promise<boolean> {
    return this.storage.init();
  }

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

  async createBucket(name?: string): Promise<string> {
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

  async selectBucket(name?: string): Promise<void> {
    return this.storage.selectBucket(name);
  }

  async sizeOf(name: string): Promise<number> {
    return this.storage.sizeOf(name);
  }

  async fileExists(name: string): Promise<boolean> {
    return this.storage.fileExists(name);
  }
}
