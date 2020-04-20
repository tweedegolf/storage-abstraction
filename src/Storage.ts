import path from "path";
import { Readable } from "stream";
import { IStorage, AdapterConfig, JSON as TypeJSON } from "./types";

//  add new storage adapters here
const adapterClasses = {
  b2: "AdapterBackblazeB2",
  s3: "AdapterAmazonS3",
  gcs: "AdapterGoogleCloudStorage",
  local: "AdapterLocal",
};

// or here for functional adapters
const adapterFunctions = {
  b2f: "AdapterBackblazeB2F",
};

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
  private adapter: IStorage;

  constructor(config: string | AdapterConfig) {
    this.switchAdapter(config);
  }

  public getType(): string {
    return this.adapter.getType();
  }

  // public getOptions(): TypeJSON {
  //   return this.adapter.getOptions();
  // }

  public getConfiguration(): AdapterConfig {
    return this.adapter.getConfiguration();
  }

  public switchAdapter(args: string | AdapterConfig): void {
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
      const name = adapterClasses[type];
      const AdapterClass = require(path.join(__dirname, name))[name];
      // console.log(AdapterClass);
      this.adapter = new AdapterClass(args);
    } else if (adapterFunctions[type]) {
      const name = adapterFunctions[type];
      const module = require(path.join(__dirname, name));
      this.adapter = module.createAdapter(args);
    }
  }

  // all methods below are implementing IStorage

  async init(): Promise<boolean> {
    return this.adapter.init();
  }

  async test(): Promise<string> {
    return this.adapter.test();
  }

  async addFileFromBuffer(buffer: Buffer, targetPath: string): Promise<void> {
    return this.adapter.addFileFromBuffer(buffer, targetPath);
  }

  async addFileFromPath(origPath: string, targetPath: string): Promise<void> {
    return this.adapter.addFileFromPath(origPath, targetPath);
  }

  async addFileFromReadable(stream: Readable, targetPath: string): Promise<void> {
    return this.adapter.addFileFromReadable(stream, targetPath);
  }

  async createBucket(name?: string): Promise<string> {
    return this.adapter.createBucket(name);
  }

  async clearBucket(name?: string): Promise<string> {
    return this.adapter.clearBucket(name);
  }

  async deleteBucket(name?: string): Promise<string> {
    return this.adapter.deleteBucket(name);
  }

  async listBuckets(): Promise<string[]> {
    return this.adapter.listBuckets();
  }

  public getSelectedBucket(): string {
    return this.adapter.getSelectedBucket();
  }

  async getFileAsReadable(
    name: string,
    options: { start?: number; end?: number } = {}
  ): Promise<Readable> {
    const { start = 0, end } = options;
    // console.log(start, end, options);
    return this.adapter.getFileAsReadable(name, { start, end });
  }

  async removeFile(fileName: string): Promise<string> {
    return this.adapter.removeFile(fileName);
  }

  async listFiles(numFiles?: number): Promise<[string, number][]> {
    return this.adapter.listFiles(numFiles);
  }

  async selectBucket(name?: string): Promise<string> {
    return this.adapter.selectBucket(name);
  }

  async sizeOf(name: string): Promise<number> {
    return this.adapter.sizeOf(name);
  }

  async fileExists(name: string): Promise<boolean> {
    return this.adapter.fileExists(name);
  }
}
