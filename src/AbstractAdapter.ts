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
import { validateName } from "./util";

export abstract class AbstractAdapter implements IAdapter {
  protected _type = "abstract-adapter";
  protected _config: AdapterConfig | null;
  protected _configError: string | null = null;
  protected _bucketName: string = null;
  protected _client: any = null; // eslint-disable-line

  constructor(config: string | AdapterConfig) { }

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

  setSelectedBucket(bucketName: string | null) {
    this._bucketName = bucketName;
  }

  getSelectedBucket(): string | null {
    return this._bucketName;
  }

  set selectedBucket(bucketName: string | null) {
    this._bucketName = bucketName;
  }

  get selectedBucket(): string | null {
    return this._bucketName;
  }

  set bucketName(bucketName: string | null) {
    this._bucketName = bucketName;
  }

  get bucketName(): string | null {
    return this._bucketName;
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

  protected _getFileAndBucketAndOptions(...args:
    [bucketName: string, fileName: string, options?: boolean | Options | StreamOptions] |
    [fileName: string, options?: boolean | Options | StreamOptions] |
    [options: boolean | Options | StreamOptions]
  ): { bucketName: string; fileName: string; options: object | boolean, error: string } {
    const [arg1, arg2, arg3] = args;
    // console.log(arg1, arg2, arg3);
    let bucketName: string = null;
    let fileName: string = null;
    let options: object | boolean = null;
    let error = null;

    if (typeof arg1 !== "string") {
      bucketName = this._bucketName;
      if (bucketName === null) {
        error = "no bucket selected";
      }
    } else {
      bucketName = arg1;
    }

    if (typeof arg2 === "string") {
      fileName = arg2;
    } else if (typeof arg2 === "object" || typeof arg2 === "boolean") {
      bucketName = this._bucketName;
      if (bucketName === null) {
        error = "no bucket selected";
      }
      fileName = arg1 as string;
      options = arg2;
    } else {
      error = "please provide a filename";
    }

    if (typeof arg3 === "object" || typeof arg3 === "boolean") {
      options = arg3;
    }

    return {
      bucketName,
      fileName,
      options,
      error,
    };
  }

  // protected stubs

  protected abstract _listBuckets(): Promise<ResultObjectBuckets>;

  protected abstract _createBucket(name: string, options: Options): Promise<ResultObject>;

  protected abstract _clearBucket(name: string): Promise<ResultObject>;

  protected abstract _deleteBucket(name: string): Promise<ResultObject>;

  protected abstract _bucketExists(name: string): Promise<ResultObjectBoolean>;

  protected abstract _bucketIsPublic(name: string): Promise<ResultObjectBoolean>;

  protected abstract _listFiles(bucketName: string, numFiles: number): Promise<ResultObjectFiles>;

  protected abstract _sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;

  protected abstract _addFile(
    params: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject>;

  protected abstract _fileExists(
    bucketName: string,
    fileName: string
  ): Promise<ResultObjectBoolean>;

  protected abstract _getFileAsStream(
    bucketName: string,
    fileName: string,
    options: StreamOptions
  ): Promise<ResultObjectStream>;

  protected abstract _getFileAsURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject>;

  protected abstract _getPublicURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject>;

  protected abstract _getSignedURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject>;

  protected abstract _removeFile(
    bucketName: string,
    fileName: string,
    allVersions: boolean
  ): Promise<ResultObject>;

  // public
  public async listBuckets(): Promise<ResultObjectBuckets> {
    if (this._configError !== null) {
      return { value: null, error: this.configError };
    }
    return this._listBuckets();
  }

  public async createBucket(...args:
    [bucketName?: string, options?: Options] |
    [options?: Options]
  ): Promise<ResultObject> {
    if (this._configError !== null) {
      return { value: null, error: this.configError };
    }
    const [arg1, arg2] = args;
    let bucketName: string;

    if (typeof arg1 !== "string") {
      if (this._bucketName === null) {
        return {
          value: null,
          error: "no bucket selected",
        };
      }
      bucketName = this._bucketName;
    } else {
      bucketName = arg1 as string;
      const error = validateName(bucketName as string);
      if (error !== null) {
        return { value: null, error };
      }
    }
    return this._createBucket(bucketName, arg2 || {});
  }

  public async clearBucket(name?: string): Promise<ResultObject> {
    if (this._configError !== null) {
      return { value: null, error: this.configError };
    }
    if (typeof name === "undefined") {
      if (this._bucketName === null) {
        return {
          value: null,
          error: "no bucket selected",
        };
      }
      name = this._bucketName;
    }
    return this._clearBucket(name);
  }

  public async deleteBucket(name?: string): Promise<ResultObject> {
    if (this._configError !== null) {
      return { value: null, error: this.configError };
    }
    if (typeof name === "undefined") {
      if (this._bucketName === null) {
        return {
          value: null,
          error: "no bucket selected",
        };
      }
      name = this._bucketName;
    }
    return this._deleteBucket(name);
  }

  public async bucketExists(name?: string): Promise<ResultObjectBoolean> {
    if (this._configError !== null) {
      return { value: null, error: this.configError };
    }
    if (typeof name === "undefined") {
      if (this._bucketName === null) {
        return { value: null, error: "no bucket selected" };
      }
      name = this._bucketName;
    }
    return this._bucketExists(name);
  }

  public async bucketIsPublic(name?: string): Promise<ResultObjectBoolean> {
    if (this._configError !== null) {
      return { value: null, error: this.configError };
    }
    if (typeof name === "undefined") {
      if (this._bucketName === null) {
        return { value: null, error: "no bucket selected" };
      }
      name = this._bucketName;
    }
    return this._bucketIsPublic(name);
  }

  public async listFiles(...args:
    [bucketName?: string, numFiles?: number] |
    [numFiles?: number] |
    [bucketName?: string]
  ): Promise<ResultObjectFiles> {
    if (this._configError !== null) {
      return { value: null, error: this.configError };
    }

    const [arg1, arg2] = args;
    let bucketName: string;
    let numFiles: number = 10000;

    if (typeof arg1 === "number") {
      if (this._bucketName === null) {
        return { value: null, error: "no bucket selected" };
      }
      bucketName = this._bucketName;
      numFiles = arg1;
    } else if (typeof arg1 === "string") {
      bucketName = arg1;
      if (typeof arg2 === "number") {
        numFiles = arg2;
      }
    } else {
      if (this._bucketName === null) {
        return { value: null, error: "no bucket selected" };
      }
      bucketName = this._bucketName;
    }
    return this._listFiles(bucketName, numFiles);
  }

  public async addFile(params: FilePathParams | FileBufferParams | FileStreamParams): Promise<ResultObject> {
    if (this._configError !== null) {
      return { value: null, error: this.configError };
    }
    const { bucketName, fileName: _fn, options, error } = this._getFileAndBucketAndOptions(params.bucketName, params.targetPath, params.options);
    if (error !== null) {
      return { value: null, error };
    }
    params.bucketName = bucketName;
    params.options = options === null ? {} : options as object;
    return this._addFile(params);
  }

  public async getFileAsStream(...args:
    [bucketName: string, fileName: string, options?: StreamOptions] |
    [fileName: string, options?: StreamOptions]
  ): Promise<ResultObjectStream> {
    if (this.configError !== null) {
      return { error: this.configError, value: null };
    }
    const { bucketName, fileName, options, error } = this._getFileAndBucketAndOptions(...args);
    if (error !== null) {
      return { error, value: null };
    }
    return this._getFileAsStream(bucketName, fileName, options === null ? {} : options as StreamOptions);
  }

  /**
   * @deprecated: please use getPublicURL or getSignedURL
   */
  public async getFileAsURL(...args:
    [bucketName: string, fileName: string, options?: Options] |
    [fileName: string, options?: Options]
  ): Promise<ResultObject> {
    if (this._configError !== null) {
      return { value: null, error: this.configError };
    }
    const { bucketName, fileName, options, error } = this._getFileAndBucketAndOptions(...args);
    if (error !== null) {
      return { error, value: null };
    }
    return this._getFileAsURL(bucketName, fileName, options === null ? {} : options as Options);
  }

  public async getPublicURL(...args:
    [bucketName: string, fileName: string, options?: Options] |
    [fileName: string, options?: Options]
  ): Promise<ResultObject> {
    const { bucketName, fileName, options: opt, error } = this._getFileAndBucketAndOptions(...args);
    if (error !== null) {
      return { error, value: null };
    }
    const options = opt === null ? {} : opt as Options
    return this._getPublicURL(bucketName, fileName, options);
  }

  public async getSignedURL(...args:
    [bucketName: string, fileName: string, options?: Options] |
    [fileName: string, options?: Options]
  ): Promise<ResultObject> {
    const { bucketName, fileName, options, error } = this._getFileAndBucketAndOptions(...args);
    if (error !== null) {
      return { error, value: null };
    }
    return this._getSignedURL(bucketName, fileName, options === null ? {} : options as Options);
  }

  public async sizeOf(...args:
    [bucketName: string, fileName: string] |
    [fileName: string]
  ): Promise<ResultObjectNumber> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }
    const { bucketName, fileName, options: _o, error } = this._getFileAndBucketAndOptions(...args);
    if (error !== null) {
      return { value: null, error };
    }
    return this._sizeOf(bucketName, fileName);
  }

  public async fileExists(...args:
    [bucketName: string, fileName: string] |
    [fileName: string]
  ): Promise<ResultObjectBoolean> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }
    const { bucketName, fileName, options: _o, error } = this._getFileAndBucketAndOptions(...args);
    if (error !== null) {
      return { value: null, error };
    }
    return this._fileExists(bucketName, fileName);
  }

  public async removeFile(...args:
    [bucketName: string, fileName: string, allVersions?: boolean] |
    [fileName: string, allVersions?: boolean]
  ): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }
    const { bucketName, fileName, options: allVersions, error } = this._getFileAndBucketAndOptions(...args);
    if (error !== null) {
      return { error, value: null };
    }
    return this._removeFile(bucketName, fileName, allVersions === null ? false : allVersions as boolean);
  }
}
