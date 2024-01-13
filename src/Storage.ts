import path from "path";
import {
  IAdapter,
  AdapterConfig,
  Options,
  StreamOptions,
  StorageAdapterConfig,
} from "./types/general";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params";
import {
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectStream,
} from "./types/result";

//  add new storage adapters here
const adapterClasses = {
  b2: "AdapterBackblazeB2",
  s3: "AdapterAmazonS3",
  gcs: "AdapterGoogleCloudStorage",
  local: "AdapterLocal",
  azure: "AdapterAzureStorageBlob",
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

export class Storage implements IAdapter {
  private _adapter: IAdapter;
  // public ready: Promise<void>;

  constructor(config: string | StorageAdapterConfig) {
    // this.ready = this.switchAdapter(config);
    this.switchAdapter(config);
  }

  get adapter(): IAdapter {
    return this._adapter;
  }

  public getAdapter(): IAdapter {
    return this.adapter;
  }

  // public async switchAdapter(config: string | AdapterConfig): Promise<void> {
  public switchAdapter(config: string | StorageAdapterConfig): void {
    // console.log(config);
    // at this point we are only interested in the type of the config
    let type: string;
    if (typeof config === "string") {
      if (config.indexOf("://") !== -1) {
        type = config.substring(0, config.indexOf("://"));
      } else {
        // you can also pass a string that only contains the type, e.g. "gcs"
        type = config;
      }
    } else {
      type = config.type;
    }
    // console.log("type", type);
    // console.log("class", adapterClasses[type], "function", adapterFunctions[type]);
    if (!adapterClasses[type] && !adapterFunctions[type]) {
      throw new Error(`unsupported storage type, must be one of ${availableAdapters}`);
    }
    if (adapterClasses[type]) {
      const name = adapterClasses[type];
      const AdapterClass = require(path.join(__dirname, name))[name];
      this._adapter = new AdapterClass(config);
      // const AdapterClass = await import(`./${name}`);
      // this.adapter = new AdapterClass[name](args);
    } else if (adapterFunctions[type]) {
      const name = adapterFunctions[type];
      // const module = require(path.join(__dirname, name));
      const module = require(path.join(__dirname, name));
      this._adapter = module.createAdapter(config);
    }
  }

  // all methods below are implementing IStorage

  get type(): string {
    return this.adapter.type;
  }

  public getType(): string {
    return this.adapter.type;
  }

  get config(): AdapterConfig {
    return this.adapter.config;
  }

  public getConfig(): AdapterConfig {
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
