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
  protected configuration: AdapterConfig;

  getType(): string {
    return this.type;
  }

  public get config(): AdapterConfig {
    return this.configuration;
  }

  public getConfiguration(): AdapterConfig {
    return this.configuration;
  }

  async addFileFromPath(params: FilePath): Promise<ResultObject> {
    return await this.store(params);
  }

  async addFileFromBuffer(params: FileBuffer): Promise<ResultObject> {
    return await this.store(params);
  }

  async addFileFromReadable(params: FileStream): Promise<ResultObject> {
    return await this.store(params);
  }

  // stubs

  protected abstract store(param: FilePath): Promise<ResultObject>;
  protected abstract store(param: FileBuffer): Promise<ResultObject>;
  protected abstract store(param: FileStream): Promise<ResultObject>;

  abstract createBucket(name: string, options?: object): Promise<ResultObject>;

  abstract clearBucket(name: string): Promise<ResultObject>;

  abstract deleteBucket(name: string): Promise<ResultObject>;

  abstract listBuckets(): Promise<ResultObjectBuckets>;

  abstract getFileAsReadable(
    bucketName: string,
    fileName: string,
    options?: { start?: number; end?: number }
  ): Promise<ResultObjectReadable>;

  abstract getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject>;

  abstract removeFile(bucketName: string, fileName: string): Promise<ResultObject>;

  abstract listFiles(bucketName: string): Promise<ResultObjectFiles>;

  abstract sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;

  abstract fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>;

  abstract bucketExists(name: string): Promise<ResultObjectBoolean>;
}
