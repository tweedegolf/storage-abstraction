import path from "path";
import { Readable } from "stream";
import { IStorage, IAdapterConfig, JSON as TypeJSON } from "./types";
import { adapterFunctions, adapterClasses } from "./adapters";

const availableAdapters: string = Object.keys(adapterClasses)
  .concat(Object.keys(adapterFunctions))
  .reduce((acc, val) => {
    if (acc.findIndex(v => v === val) === -1) {
      acc.push(val);
    }
    return acc;
  }, [])
  .sort()
  .join(", ");

export class Storage implements IStorage {
  private storage: IStorage;

  constructor(config: string | IAdapterConfig) {
    this.switchAdapter(config);
  }

  public getType(): string {
    return this.storage.getType();
  }

  public getOptions(): TypeJSON {
    return this.storage.getOptions();
  }

  public getConfiguration(): IAdapterConfig {
    return this.storage.getConfiguration();
  }

  public switchAdapter(args: string | IAdapterConfig): void {
    let type: string;
    if (typeof args === "string") {
      type = args.substring(0, args.indexOf("://"));
    } else {
      type = args.type;
    }
    // console.log("type", type);
    if (!adapterClasses[type] && !adapterFunctions[type]) {
      throw new Error(`unsupported storage type, must be one of ${availableAdapters}`);
    }
    // console.log("class", adapterClasses[type], "function", adapterFunctions[type]);
    if (adapterClasses[type]) {
      const { name, path: p } = adapterClasses[type];
      const StorageClass = require(path.join(__dirname, p))[name];
      // console.log(StorageClass);
      this.storage = new StorageClass(args);
    } else if (adapterFunctions[type]) {
      const { name, path: p } = adapterFunctions[type];
      const createFunction = require(path.join(__dirname, p))[name];
      // console.log(createFunction);
      this.storage = createFunction(args);
    }
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

  public getSelectedBucket(): string {
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
