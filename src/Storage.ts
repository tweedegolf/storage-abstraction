import path from "path";
import {
  IAdapter,
  AdapterConfig,
  Options,
  StreamOptions,
  StorageAdapterConfig,
  Provider,
} from "./types/general";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params";
import {
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectObject,
  ResultObjectStream,
} from "./types/result";
import { adapterClasses, adapterFunctions, getAvailableAdapters } from "./adapters";

const availableAdapters: string = getAvailableAdapters();

/**
 * @implements {IAdapter}
 */
export class Storage implements IAdapter {
  declare private _adapter: IAdapter;
  // public ready: Promise<void>;

  constructor(config: string | StorageAdapterConfig) {
    // this.ready = this.switchAdapter(config);
    this.switchAdapter(config);
  }

  // public async switchAdapter(config: string | AdapterConfig): Promise<void> {
  public switchAdapter(config: string | StorageAdapterConfig): void {
    // console.log(config);
    // at this point we are only interested in the type of the config
    let provider: string;
    if (typeof config === "string") {
      if (config.indexOf("://") !== -1) {
        provider = config.substring(0, config.indexOf("://"));
      } else {
        // you can also pass a string that only contains the type, e.g. "gcs"
        provider = config;
      }
    } else {
      provider = config.provider;
    }
    // console.log("provider", provider);
    // console.log("adapterClasses", adapterClasses);
    // console.log("class", adapterClasses[provider], "function", adapterFunctions[type]);
    if (!adapterClasses[provider] && !adapterFunctions[provider]) {
      throw new Error(`unsupported storage type, must be one of ${availableAdapters}`);
    }
    if (adapterClasses[provider]) {
      const adapterName = adapterClasses[provider][0];
      const adapterPath = adapterClasses[provider][1];
      // const AdapterClass = require(path.join(__dirname, name));
      let AdapterClass: any; // eslint-disable-line
      try {
        AdapterClass = require(adapterPath)[adapterName];
        // console.log(`using remote adapter class ${adapterName}`);
      } catch (e) {
        // console.log(`using local adapter class ${adapterName}`);
        // console.log(e.message);
        try {
          AdapterClass = require(path.join(__dirname, adapterName))[adapterName];
        } catch (e) {
          if (e instanceof Error) {
            throw e.message;
          } else {
            throw e;
          }
        }
      }
      this._adapter = new AdapterClass(config);
      // const AdapterClass = await import(`./${name}`);
      // this.adapter = new AdapterClass[name](args);
    } else if (adapterFunctions[provider]) {
      const adapterName = adapterClasses[provider][0];
      const adapterPath = adapterClasses[provider][1];
      // const module = require(path.join(__dirname, name));
      let module: any; // eslint-disable-line
      try {
        module = require(adapterPath);
      } catch (e) {
        module = require(require(path.join(__dirname, adapterPath)));
      }
      this._adapter = module.createAdapter(config);
    }
  }

  // introspective adapter API

  setSelectedBucket(bucketName: string | null) {
    this.adapter.bucketName = bucketName;
  }

  set selectedBucket(bucketName: string | null) {
    this.adapter.bucketName = bucketName;
  }

  getSelectedBucket(): string | null {
    return this.adapter.bucketName;
  }

  get selectedBucket(): string | null {
    return this.adapter.bucketName;
  }

  set bucketName(bucketName: string | null) {
    this.adapter.bucketName = bucketName;
  }

  get bucketName(): string | null {
    return this.adapter.bucketName;
  }

  get adapter(): IAdapter {
    return this._adapter;
  }

  public getAdapter(): IAdapter {
    return this.adapter;
  }

  get provider(): Provider {
    return this.adapter.provider;
  }

  public getProvider(): Provider {
    return this.adapter.provider;
  }

  get config(): AdapterConfig {
    return this.adapter.config;
  }

  public getConfig(): AdapterConfig {
    return this.adapter.config;
  }

  get configError(): string | null {
    return this.adapter.configError;
  }

  public getConfigError(): string | null {
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

  // public adapter API

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

  async createBucket(
    ...args: [bucketName?: string, options?: Options] | [options?: Options]
  ): Promise<ResultObject> {
    return this.adapter.createBucket(...args);
  }

  async clearBucket(bucketName?: string): Promise<ResultObject> {
    return this.adapter.clearBucket(bucketName);
  }

  async deleteBucket(bucketName?: string): Promise<ResultObject> {
    return this.adapter.deleteBucket(bucketName);
  }

  async listBuckets(): Promise<ResultObjectBuckets> {
    return this.adapter.listBuckets();
  }

  async getFileAsStream(
    ...args:
      | [bucketName: string, fileName: string, options?: StreamOptions]
      | [fileName: string, options?: StreamOptions]
  ): Promise<ResultObjectStream> {
    return this.adapter.getFileAsStream(...args);
  }

  async getPublicURL(
    ...args:
      | [bucketName: string, fileName: string, options?: Options]
      | [fileName: string, options?: Options]
  ): Promise<ResultObject> {
    return this.adapter.getPublicURL(...args);
  }
  async getSignedURL(
    ...args:
      | [bucketName: string, fileName: string, options?: Options]
      | [fileName: string, options?: Options]
  ): Promise<ResultObject> {
    return this.adapter.getSignedURL(...args);
  }

  async removeFile(
    ...args: [bucketName: string, fileName: string] | [fileName: string]
  ): Promise<ResultObject> {
    return this.adapter.removeFile(...args);
  }

  async listFiles(
    ...args: [bucketName: string, numFiles?: number] | [numFiles?: number] | [bucketName?: string]
  ): Promise<ResultObjectFiles> {
    return this.adapter.listFiles(...args);
  }

  async sizeOf(
    ...args: [bucketName: string, fileName: string] | [fileName: string]
  ): Promise<ResultObjectNumber> {
    return this.adapter.sizeOf(...args);
  }

  async bucketExists(bucketName?: string): Promise<ResultObjectBoolean> {
    return this.adapter.bucketExists(bucketName);
  }

  async bucketIsPublic(bucketName?: string): Promise<ResultObjectBoolean> {
    return this.adapter.bucketIsPublic(bucketName);
  }

  async fileExists(
    ...args: [bucketName: string, fileName: string] | [fileName: string]
  ): Promise<ResultObjectBoolean> {
    return this.adapter.fileExists(...args);
  }

  async getPresignedUploadURL(
    ...args:
      | [bucketName: string, fileName: string, options?: Options]
      | [fileName: string, options?: Options]
  ): Promise<ResultObjectObject> {
    return this.adapter.getPresignedUploadURL(...args);
  }
}
