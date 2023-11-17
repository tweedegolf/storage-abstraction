import {
  AdapterConfig,
  FileBuffer,
  FilePath,
  FileStream,
  IStorage,
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectReadable,
} from "./types";

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

  async test(): Promise<ResultObject> {
    if (this.initialized === false) {
      return Promise.resolve({
        value: null,
        error: "storage has not been initialized yet; call Storage.init() first",
      });
    }

    if (this.bucketName) {
      let result: ResultObject;
      try {
        const { error } = await this.bucketExists(this.bucketName);
        if (error === null) {
          result = { value: "ok", error };
        } else {
          result = { value: null, error };
        }
      } catch (e) {
        result = {
          value: null,
          error: `Looks like the storage configuration is not correct (${e.message})`,
        };
      }
      return Promise.resolve(result);
    }

    let result: ResultObject;
    try {
      const { error } = await this.listBuckets();
      if (error === null) {
        result = { value: "ok", error };
      } else {
        result = { value: null, error };
      }
    } catch (e) {
      result = {
        value: null,
        error: `Looks like the storage configuration is not correct (${e.message})`,
      };
    }
    return Promise.resolve(result);
  }

  async addFileFromPath(params: FilePath): Promise<ResultObject> {
    if (this.initialized === false) {
      return Promise.resolve({
        value: null,
        error: "storage has not been initialized yet; call Storage.init() first",
      });
    }

    return await this.store(params);
  }

  async addFileFromBuffer(params: FileBuffer): Promise<ResultObject> {
    if (this.initialized === false) {
      return Promise.resolve({
        value: null,
        error: "storage has not been initialized yet; call Storage.init() first",
      });
    }
    return await this.store(params);
  }

  async addFileFromReadable(params: FileStream): Promise<ResultObject> {
    if (this.initialized === false) {
      return Promise.resolve({
        value: null,
        error: "storage has not been initialized yet; call Storage.init() first",
      });
    }
    return await this.store(params);
  }

  // stubs

  protected abstract store(param: FilePath): Promise<ResultObject>;
  protected abstract store(param: FileBuffer): Promise<ResultObject>;
  protected abstract store(param: FileStream): Promise<ResultObject>;

  abstract init(): Promise<ResultObject>;

  abstract createBucket(name: string, options?: object): Promise<ResultObject>;

  abstract clearBucket(name: string): Promise<ResultObject>;

  abstract deleteBucket(name: string): Promise<ResultObject>;

  abstract listBuckets(): Promise<ResultObjectBuckets>;

  abstract getFileAsReadable(
    name: string,
    options?: { start?: number; end?: number }
  ): Promise<ResultObjectReadable>;

  abstract removeFile(bucketName: string, fileName: string): Promise<ResultObject>;

  abstract listFiles(bucketName: string): Promise<ResultObjectFiles>;

  abstract sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;

  abstract fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>;

  abstract bucketExists(name: string): Promise<ResultObjectBoolean>;
}
