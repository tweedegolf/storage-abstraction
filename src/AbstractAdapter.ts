import {
  AdapterConfig,
  FileBufferParams,
  FilePathParams,
  FileStreamParams,
  IStorage,
  Options,
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectStream,
} from "./types";
import { parseUrl } from "./util";

export abstract class AbstractAdapter implements IStorage {
  protected _type = "abstract-adapter";
  protected _config: AdapterConfig | null;
  protected _configError: string | null = null;
  protected _client: any = null; // eslint-disable-line

  constructor(config?: string | AdapterConfig) {
    if (typeof config === "string") {
      const { value, error } = parseUrl(config);
      if (error) {
        this._configError = `[configError] ${error}`;
      }
      this._config = value;
    } else {
      this._config = { ...config };
    }
  }

  get type(): string {
    return this._type;
  }

  get config(): AdapterConfig {
    return this._config;
  }

  get configError(): string {
    return this._configError;
  }

  // eslint-disable-next-line
  get serviceClient(): any {
    return this._client;
  }

  getType(): string {
    return this.type;
  }

  getConfigError(): string {
    return this.configError;
  }

  getConfiguration(): AdapterConfig {
    return this.config;
  }

  // eslint-disable-next-line
  getServiceClient(): any {
    return this._client;
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
    options?: Options
  ): Promise<ResultObjectStream>;

  abstract getFileAsURL(
    bucketName: string,
    fileName: string,
    options?: Options
  ): Promise<ResultObject>;

  abstract removeFile(
    bucketName: string,
    fileName: string,
    allVersions?: boolean
  ): Promise<ResultObject>;

  abstract listFiles(bucketName: string, maxFiles: number): Promise<ResultObjectFiles>;

  abstract sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;

  abstract fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>;

  abstract bucketExists(name: string): Promise<ResultObjectBoolean>;
}
