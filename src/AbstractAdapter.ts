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
import { parseQueryString } from "./util";

export abstract class AbstractAdapter implements IAdapter {
  protected _type = "abstract-adapter";
  protected _config: AdapterConfig | null;
  protected _configError: string | null = null;
  protected _bucketName: string = null;
  protected _client: any = null; // eslint-disable-line

  constructor(config: string | AdapterConfig) {
    if (typeof config === "string") {
      const p = config.indexOf("://");
      if (p !== -1) {
        // strip the type, we don't need it anymore at this point
        config = config.substring(p);
      }
      this._config = parseQueryString(config);
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

  setSelectedBucket(bucketName: string | null) {
    this._bucketName = bucketName;
  }

  getSelectedBucket(): string | null {
    return this._bucketName;
  }

  set(bucketName: string | null) {
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

  protected _getFileAndBucket(
    arg1: string,
    arg2?: string
  ): { bucketName: string; fileName: string; error: string } {
    let bucketName: string = null;
    let fileName: string = null;
    if (typeof arg2 === "string") {
      bucketName = arg1;
      fileName = arg2;
    } else if (typeof arg2 === "undefined") {
      fileName = arg1;
      if (this._bucketName === null) {
        return {
          bucketName,
          fileName,
          error: "no bucket selected",
        };
      }
      bucketName = this._bucketName;
    }
    return {
      bucketName,
      fileName,
      error: null,
    };
  }

  // protected stubs

  protected abstract _clearBucket(name: string): Promise<ResultObject>;

  protected abstract _deleteBucket(name: string): Promise<ResultObject>;

  protected abstract _bucketExists(name: string): Promise<ResultObjectBoolean>;

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
    options: Options // e.g. { expiresIn: 3600 }
  ): Promise<ResultObject>;

  protected abstract _removeFile(
    bucketName: string,
    fileName: string,
    allVersions: boolean
  ): Promise<ResultObject>;

  // public stubs

  abstract listBuckets(): Promise<ResultObjectBuckets>;

  abstract createBucket(name: string, options?: Options): Promise<ResultObject>;

  // public

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
        return {
          value: null,
          error: "no bucket selected",
        };
      }
      name = this._bucketName;
    }
    return this._bucketExists(name);
  }

  public async listFiles(bucketName: string, numFiles?: number): Promise<ResultObjectFiles>;
  public async listFiles(numFiles?: number): Promise<ResultObjectFiles>;
  public async listFiles(arg1?: number | string, arg2?: number): Promise<ResultObjectFiles> {
    if (this._configError !== null) {
      return { value: null, error: this.configError };
    }

    let bucketName: string;
    let numFiles: number = 10000;

    if (typeof arg1 === "number") {
      if (this._bucketName === null) {
        return {
          value: null,
          error: "no bucket selected",
        };
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
        return {
          value: null,
          error: "no bucket selected",
        };
      }
      bucketName = this._bucketName;
    }
    return this._listFiles(bucketName, numFiles);
  }

  public async addFile(
    params: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    if (this._configError !== null) {
      return { value: null, error: this.configError };
    }

    if (typeof params.bucketName === "undefined") {
      if (this._bucketName === null) {
        return {
          value: null,
          error: "no bucket selected",
        };
      }
      params.bucketName = this._bucketName;
    }
    if (typeof params.options !== "object") {
      params.options = {};
    }
    return this._addFile(params);
  }

  public async getFileAsStream(
    bucketName: string,
    fileName: string,
    options: StreamOptions
  ): Promise<ResultObjectStream>;
  public async getFileAsStream(
    fileName: string,
    options: StreamOptions
  ): Promise<ResultObjectStream>;
  public async getFileAsStream(
    arg1: string,
    arg2?: StreamOptions | string,
    arg3?: StreamOptions
  ): Promise<ResultObjectStream> {
    if (this.configError !== null) {
      return { error: this.configError, value: null };
    }

    let bucketName: string;
    let fileName: string;
    let options: StreamOptions = {};
    if (typeof arg1 === "string" && typeof arg2 === "string") {
      bucketName = arg1;
      fileName = arg2;
      if (typeof arg3 !== "undefined") {
        options = arg3;
      }
    } else if (typeof arg1 === "string" && typeof arg2 !== "string") {
      if (this._bucketName === null) {
        return {
          value: null,
          error: "no bucket selected",
        };
      }
      bucketName = this._bucketName;
      fileName = arg1;
      if (typeof arg2 !== "undefined") {
        options = arg2;
      }
    }
    return this._getFileAsStream(bucketName, fileName, options);
  }

  public async getFileAsURL(
    bucketName: string,
    fileName: string,
    options: Options // e.g. { expiresIn: 3600 }
  ): Promise<ResultObject>;
  public async getFileAsURL(fileName: string, options?: Options): Promise<ResultObject>;
  public async getFileAsURL(
    arg1: string,
    arg2?: Options | string,
    arg3?: Options
  ): Promise<ResultObject> {
    if (this._configError !== null) {
      return { value: null, error: this.configError };
    }

    let bucketName: string;
    let fileName: string;
    let options: Options = {};
    if (typeof arg1 === "string" && typeof arg2 === "string") {
      bucketName = arg1;
      fileName = arg2;
      if (typeof arg3 !== "undefined") {
        options = arg3;
      }
    } else if (typeof arg1 === "string" && typeof arg2 !== "string") {
      if (this._bucketName === null) {
        return {
          value: null,
          error: "no bucket selected",
        };
      }
      bucketName = this._bucketName;
      fileName = arg1;
      if (typeof arg2 !== "undefined") {
        options = arg2;
      }
    }
    return this._getFileAsURL(bucketName, fileName, options);
  }

  public async sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;
  public async sizeOf(fileName: string): Promise<ResultObjectNumber>;
  public async sizeOf(arg1: string, arg2?: string): Promise<ResultObjectNumber> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }
    const { bucketName, fileName, error } = this._getFileAndBucket(arg1, arg2);
    if (error !== null) {
      return { value: null, error };
    }
    return this._sizeOf(bucketName, fileName);
  }

  public async fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>;
  public async fileExists(fileName: string): Promise<ResultObjectBoolean>;
  public async fileExists(arg1: string, arg2?: string): Promise<ResultObjectBoolean> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }
    const { bucketName, fileName, error } = this._getFileAndBucket(arg1, arg2);
    if (error !== null) {
      return { value: null, error };
    }
    return this.fileExists(bucketName, fileName);
  }

  public async removeFile(
    bucketName: string,
    fileName: string,
    allVersions?: boolean
  ): Promise<ResultObject>;
  public async removeFile(fileName: string, allVersions?: boolean): Promise<ResultObject>;
  public async removeFile(
    arg1: string,
    arg2?: boolean | string,
    arg3?: boolean
  ): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    let bucketName: string;
    let fileName: string;
    let allVersions: boolean = false;

    if (typeof arg1 === "string" && typeof arg2 === "string") {
      bucketName = arg1;
      fileName = arg2;
      if (typeof arg3 === "boolean") {
        allVersions = arg3;
      }
    } else if (typeof arg1 === "string" && typeof arg2 !== "string") {
      if (this._bucketName === null) {
        return {
          value: null,
          error: "No bucket selected",
        };
      }
      bucketName = this._bucketName;
      fileName = arg1;
      if (typeof arg2 === "boolean") {
        allVersions = arg2;
      }
    }
    return this._removeFile(bucketName, fileName, allVersions);
  }
}
