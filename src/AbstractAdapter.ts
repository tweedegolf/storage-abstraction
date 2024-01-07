import { AdapterConfig, IAdapter, Options, StreamOptions } from "./types/general";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params";
import {
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectStream,
} from "./types/result";
import { parseUrl } from "./util";

export abstract class AbstractAdapter implements IAdapter {
  protected _type = "abstract-adapter";
  protected _config: AdapterConfig | null;
  protected _configError: string | null = null;
  protected _client: any = null; // eslint-disable-line

  constructor(config: string | AdapterConfig) {
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

  getType(): string {
    return this.type;
  }

  get config(): AdapterConfig {
    return this._config;
  }

  getConfig(): AdapterConfig {
    return this.config;
  }

  get configError(): string {
    return this._configError;
  }

  getConfigError(): string {
    return this.configError;
  }

  // eslint-disable-next-line
  get serviceClient(): any {
    return this._client;
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

  // async createBucket(name: string, options?: Options): Promise<ResultObject> {
  //   const error = validateName(name);
  //   if (error !== null) {
  //     return { value: null, error };
  //   }
  //   return await this.createBucket(name, options);
  // }

  // stubs

  abstract addFile(
    paramObject: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject>;

  abstract createBucket(name: string, options?: Options): Promise<ResultObject>;

  abstract clearBucket(name: string): Promise<ResultObject>;

  abstract deleteBucket(name: string): Promise<ResultObject>;

  abstract listBuckets(): Promise<ResultObjectBuckets>;

  abstract getFileAsStream(
    bucketName: string,
    fileName: string,
    options?: StreamOptions
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
