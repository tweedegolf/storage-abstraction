import {
  AdapterConfig,
  FileBufferParams,
  FilePathParams,
  FileStreamParams,
  IStorage,
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectStream,
} from "./types";

export abstract class AbstractAdapter implements IStorage {
  protected _type = "abstract-adapter";
  protected conf: AdapterConfig;

  get type(): string {
    return this._type;
  }

  get config(): AdapterConfig {
    return this.conf;
  }

  getType(): string {
    return this._type;
  }

  getConfiguration(): AdapterConfig {
    return this.conf;
  }

  async addFileFromPath(params: FilePathParams): Promise<ResultObject> {
    return await this.addFile(params);
  }

  async addFileFromBuffer(params: FileBufferParams): Promise<ResultObject> {
    return await this.addFile(params);
  }

  async addFileFromStream(params: FileStreamParams): Promise<ResultObject> {
    return await this.addFile(params);
  }

  // stubs

  abstract addFile(
    paramObject: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject>;

  abstract createBucket(name: string, options?: object): Promise<ResultObject>;

  abstract clearBucket(name: string): Promise<ResultObject>;

  abstract deleteBucket(name: string): Promise<ResultObject>;

  abstract listBuckets(): Promise<ResultObjectBuckets>;

  abstract getFileAsStream(
    bucketName: string,
    fileName: string,
    options?: { start?: number; end?: number }
  ): Promise<ResultObjectStream>;

  abstract getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject>;

  abstract removeFile(
    bucketName: string,
    fileName: string,
    allVersions?: boolean
  ): Promise<ResultObject>;

  abstract listFiles(bucketName: string): Promise<ResultObjectFiles>;

  abstract sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;

  abstract fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>;

  abstract bucketExists(name: string): Promise<ResultObjectBoolean>;
}
