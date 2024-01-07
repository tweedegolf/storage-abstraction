import path from "path";
import {
  IStorage,
  AdapterConfig,
  FileBufferParams,
  ResultObject,
  FilePathParams,
  FileStreamParams,
  ResultObjectBuckets,
  ResultObjectStream,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectBoolean,
  Options,
  StreamOptions,
} from "./types";

//  add new storage adapters here
const adapterClasses = {
  b2: "AdapterBackblazeB2",
  s3: "AdapterAmazonS3",
  gcs: "AdapterGoogleCloud",
  local: "AdapterLocal",
  azure: "AdapterAzureBlob",
  minio: "AdapterMinio",
};

// or here for functional adapters
const adapterFunctions = {
  b2f: "AdapterBackblazeB2F",
};

const availableAdapters: string = Object.keys(adapterClasses)
  .concat(Object.keys(adapterFunctions))
  .reduce((acc, val) => {
    if (acc.findIndex((v) => v === val) === -1) {
      acc.push(val);
    }
    return acc;
  }, [])
  .sort()
  .join(", ");

export class Storage implements IStorage {
  private adapter: IStorage;
  // public ready: Promise<void>;

  constructor(config: string | AdapterConfig) {
    // this.ready = this.switchAdapter(config);
    this.switchAdapter(config);
  }

  get type(): string {
    return this.adapter.type;
  }

  public getType(): string {
    return this.adapter.type;
  }

  get config(): AdapterConfig {
    return this.adapter.config;
  }

  public getConfiguration(): AdapterConfig {
    return this.adapter.config;
  }

  get configError(): string {
    return this.adapter.configError;
  }

  public getConfigError(): string {
    return this.adapter.configError;
  }
  //eslint-disable-next-line
  get serviceClient(): any {
    return this.adapter.serviceClient;
  }
  //eslint-disable-next-line
  public getServiceClient(): any {
    return this.adapter.serviceClient;
  }

  //eslint-disable-next-line
  // get adapter(): any {
  //   return this.adapter;
  // }
  //eslint-disable-next-line
  public getAdapter(): any {
    return this.adapter;
  }

  // public async switchAdapter(args: string | AdapterConfig): Promise<void> {
  public switchAdapter(args: string | AdapterConfig): void {
    // console.log(args);
    let type: string;
    if (typeof args === "string") {
      if (args.indexOf("://") !== -1) {
        type = args.substring(0, args.indexOf("://"));
      } else {
        type = args;
      }
    } else {
      type = args.type;
    }
    // console.log("type", type);
    // console.log("class", adapterClasses[type], "function", adapterFunctions[type]);
    if (!adapterClasses[type] && !adapterFunctions[type]) {
      throw new Error(`unsupported storage type, must be one of ${availableAdapters}`);
    }
    if (adapterClasses[type]) {
      const name = adapterClasses[type];
      const AdapterClass = require(path.join(__dirname, name))[name];
      this.adapter = new AdapterClass(args);
      // const AdapterClass = await import(`./${name}`);
      // this.adapter = new AdapterClass[name](args);
    } else if (adapterFunctions[type]) {
      const name = adapterFunctions[type];
      // const module = require(path.join(__dirname, name));
      const module = require(path.join(__dirname, name));
      this.adapter = module.createAdapter(args);
    }
  }

  // all methods below are implementing IStorage

  public async addFile(
    paramObject: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    return this.adapter.addFile(paramObject);
  }

  async addFileFromPath(params: FilePathParams): Promise<ResultObject> {
    return this.adapter.addFileFromPath(params);
  }

  async addFileFromBuffer(params: FileBufferParams): Promise<ResultObject> {
    return this.adapter.addFileFromBuffer(params);
  }

  async addFileFromStream(params: FileStreamParams): Promise<ResultObject> {
    return this.adapter.addFileFromStream(params);
  }

  async createBucket(name: string, options?: object): Promise<ResultObject> {
    return this.adapter.createBucket(name, options);
  }

  async clearBucket(name: string): Promise<ResultObject> {
    return this.adapter.clearBucket(name);
  }

  async deleteBucket(name: string): Promise<ResultObject> {
    return this.adapter.deleteBucket(name);
  }

  async listBuckets(): Promise<ResultObjectBuckets> {
    return this.adapter.listBuckets();
  }

  async getFileAsStream(
    bucketName: string,
    fileName: string,
    options: StreamOptions = {}
  ): Promise<ResultObjectStream> {
    return this.adapter.getFileAsStream(bucketName, fileName, options);
  }

  async getFileAsURL(
    bucketName: string,
    fileName: string,
    options: Options = {}
  ): Promise<ResultObject> {
    return this.adapter.getFileAsURL(bucketName, fileName, options);
  }

  async removeFile(
    bucketName: string,
    fileName: string,
    allVersions = false
  ): Promise<ResultObject> {
    return this.adapter.removeFile(bucketName, fileName, allVersions);
  }

  async listFiles(bucketName: string, numFiles?: number): Promise<ResultObjectFiles> {
    return this.adapter.listFiles(bucketName, numFiles);
  }

  async sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    return this.adapter.sizeOf(bucketName, fileName);
  }

  async bucketExists(bucketName: string): Promise<ResultObjectBoolean> {
    return this.adapter.bucketExists(bucketName);
  }

  async fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    return this.adapter.fileExists(bucketName, fileName);
  }
}
