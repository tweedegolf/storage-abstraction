import fs from "fs";
import { AdapterConfig, IAdapter, Options, Provider, StreamOptions } from "./types/general.ts";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params.ts";
import {
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectObject,
  ResultObjectStream,
} from "./types/result.ts";
import { getErrorMessage, validateName } from "./util.ts";
import { FileHandle } from "fs/promises";

export abstract class AbstractAdapter implements IAdapter {
  protected _provider: Provider = Provider.NONE;
  declare protected _config: AdapterConfig;
  declare protected _client: any;
  protected _configError: null | string = null;
  protected _bucketName: null | string = null;

  constructor(config: string | AdapterConfig) {}

  get provider(): Provider {
    return this._provider;
  }

  getProvider(): Provider {
    return this.provider;
  }

  get config(): AdapterConfig {
    return this._config;
  }

  getConfig(): AdapterConfig {
    return this.config;
  }

  get configError(): null | string {
    return this._configError;
  }

  getConfigError(): null | string {
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

  setSelectedBucket(bucketName: null | string) {
    this._bucketName = bucketName;
  }

  getSelectedBucket(): null | string {
    return this._bucketName;
  }

  set selectedBucket(bucketName: null | string) {
    this._bucketName = bucketName;
  }

  get selectedBucket(): null | string {
    return this._bucketName;
  }

  set bucketName(bucketName: null | string) {
    this._bucketName = bucketName;
  }

  get bucketName(): null | string {
    return this._bucketName;
  }

  private getFileAndBucketAndOptions(
    ...args:
      | [bucketName?: string, fileName?: string, options?: boolean | Options | StreamOptions]
      | [fileName?: string, options?: boolean | Options | StreamOptions]
      | [options?: boolean | Options | StreamOptions]
  ): {
    bucketName: undefined | string;
    fileName: undefined | string;
    options: object | boolean;
    error: undefined | string;
  } {
    const [arg1, arg2, arg3] = args;
    // console.log("getFileAndBucketAndOptions", arg1, arg2, arg3);
    let bucketName: undefined | string = undefined;
    let fileName: undefined | string = undefined;
    let options: undefined | object | boolean = {};
    let error: undefined | string = undefined;

    if (typeof arg1 !== "string" && typeof arg2 !== "string") {
      return { bucketName, fileName, options, error: "Please provide a filename" };
    }

    if (typeof arg1 === "string" && typeof arg2 === "string") {
      bucketName = arg1;
      fileName = arg2;
      if (typeof arg3 === "object" || typeof arg3 === "boolean") {
        options = arg3;
      }
      return { bucketName, fileName, options, error };
    }

    if (typeof arg1 !== "string" && typeof arg2 === "string") {
      bucketName = this._bucketName === null ? undefined : this._bucketName;
      if (bucketName === null) {
        return { bucketName, fileName, options, error: "Please provide or select a bucket" };
      }
      fileName = arg2;
      if (typeof arg3 === "object" || typeof arg3 === "boolean") {
        options = arg3;
      }
      return { bucketName, fileName, options, error };
    }

    if (typeof arg1 === "string" && typeof arg2 !== "string") {
      bucketName = this._bucketName === null ? undefined : this._bucketName;
      if (bucketName === null) {
        return { bucketName, fileName, options, error: "Please provide or select a bucket" };
      }
      fileName = arg1;
      if (typeof arg2 === "object" || typeof arg2 === "boolean") {
        options = arg2;
      }
      return { bucketName, fileName, options, error };
    }

    if (bucketName === null) {
      return { bucketName, fileName, options, error: "Please provide or select a bucket" };
    }

    if (fileName === null) {
      return { bucketName, fileName, options, error: "Please provide a filename" };
    }

    return { bucketName, fileName, options, error };
  }

  private async checkBucket(name?: string, checkIfExists: boolean = true): Promise<ResultObject> {
    if (this._configError !== null) {
      return { value: null, error: this.configError };
    }

    if (typeof name === "undefined") {
      if (this._bucketName === null) {
        return {
          value: null,
          error: "No bucket selected.",
        };
      }
      name = this._bucketName;
    }

    if (checkIfExists === true) {
      const { value, error } = await this._bucketExists(name);
      if (error !== null) {
        return { value: null, error };
      } else if (value === false) {
        return { value: null, error: `No bucket '${name}' found.` };
      }
    }
    return { value: name, error: null };
  }

  private async checkFile(bucketName: string, fileName: string): Promise<ResultObject> {
    const r = await this._fileExists(bucketName, fileName);
    if (r.error) {
      return { value: null, error: r.error };
    }
    if (r.value === false) {
      return { value: null, error: `No file '${fileName}' found in bucket '${bucketName}'` };
    }
    return { value: null, error: null };
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

  protected abstract _removeFile(bucketName: string, fileName: string): Promise<ResultObject>;

  protected abstract _getPresignedUploadURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObjectObject>;

  // public
  public async listBuckets(): Promise<ResultObjectBuckets> {
    if (this._configError !== null) {
      return { value: null, error: this.configError };
    }
    return this._listBuckets();
  }

  public async createBucket(
    ...args: [bucketName?: string, options?: Options] | [options?: Options]
  ): Promise<ResultObject> {
    if (this._configError !== null) {
      return { value: null, error: this.configError };
    }
    const [arg1, arg2] = args;
    let name: string;

    if (typeof arg1 !== "string") {
      if (this._bucketName === null) {
        return {
          value: null,
          error: "No bucket selected.",
        };
      }
      name = this._bucketName;
    } else {
      name = arg1 as string;
      const error = validateName(name as string, this.provider);
      if (error !== null) {
        return { value: null, error };
      }
    }

    const { value, error } = await this.bucketExists(name);
    if (error !== null) {
      return { value: null, error };
    } else if (value === true) {
      return { value: null, error: `Bucket '${name}' already exists.` };
    }

    return this._createBucket(name, arg2 || {});
  }

  public async clearBucket(name?: string): Promise<ResultObject> {
    const r = await this.checkBucket(name, true);
    if (r.error !== null) {
      return { value: null, error: r.error };
    }
    name = r.value as string;
    return this._clearBucket(name);
  }

  public async deleteBucket(name?: string): Promise<ResultObject> {
    const r = await this.checkBucket(name, true);
    if (r.error !== null) {
      if (r.error === `No bucket '${name}' found.`) {
        return { value: r.error, error: null };
      } else {
        return r;
      }
    }
    name = r.value as string;
    if (this.selectedBucket === name) {
      this.selectedBucket = null;
    }
    return this._deleteBucket(name);
  }

  public async bucketExists(name?: string): Promise<ResultObjectBoolean> {
    const r = await this.checkBucket(name, false);
    if (r.error !== null) {
      return { value: null, error: r.error };
    }
    name = r.value as string;
    return this._bucketExists(name);
  }

  public async bucketIsPublic(name?: string): Promise<ResultObjectBoolean> {
    const r = await this.checkBucket(name, true);
    if (r.error !== null) {
      return { value: null, error: r.error };
    }
    name = r.value as string;
    return this._bucketIsPublic(name);
  }

  public async listFiles(
    ...args: [bucketName?: string, numFiles?: number] | [numFiles?: number] | [bucketName?: string]
  ): Promise<ResultObjectFiles> {
    const [arg1, arg2] = args;
    let bucketName: undefined | string = undefined;
    let numFiles: number = 10000;

    if (typeof arg1 === "number") {
      numFiles = arg1;
    } else if (typeof arg1 === "string") {
      bucketName = arg1;
      if (typeof arg2 === "number") {
        numFiles = arg2;
      }
    }

    const r = await this.checkBucket(bucketName, true);
    if (r.error) {
      return { value: null, error: r.error };
    }
    // console.log(bucketName, numFiles)
    return this._listFiles(r.value as string, numFiles);
  }

  public async addFileFromPath(params: FilePathParams): Promise<ResultObject> {
    return await this.addFile(params);
  }

  public async addFileFromBuffer(params: FileBufferParams): Promise<ResultObject> {
    return await this.addFile(params);
  }

  public async addFileFromStream(params: FileStreamParams): Promise<ResultObject> {
    return await this.addFile(params);
  }

  public async addFile(
    params: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    const {
      bucketName,
      fileName: _fn,
      options,
      error,
    } = this.getFileAndBucketAndOptions(params.bucketName, params.targetPath, params.options);
    if (error !== null) {
      return { value: null, error: error as string };
    }

    const r = await this.checkBucket(bucketName);
    if (r.error !== null) {
      return { value: null, error: r.error };
    } else {
      params.bucketName = r.value as string;
      params.options = options === null ? {} : (options as object);
    }

    let fh: null | FileHandle = null;
    if (typeof (params as FilePathParams).origPath === "string") {
      const f = (params as FilePathParams).origPath;
      try {
        fh = await fs.promises.open(f);
      } catch (e: unknown) {
        return { value: null, error: getErrorMessage(e) };
      }
      const readStream = fs.createReadStream(f);
      (params as FileStreamParams) = {
        bucketName: params.bucketName,
        options: params.options,
        stream: readStream,
        targetPath: params.targetPath,
      };
    }

    const r2 = await this._addFile(params);
    if (fh !== null) {
      fh.close();
    }
    return r2;
  }

  public async getFileAsStream(
    ...args:
      | [bucketName: string, fileName: string, options?: StreamOptions]
      | [fileName: string, options?: StreamOptions]
  ): Promise<ResultObjectStream> {
    const { bucketName, fileName, options, error } = this.getFileAndBucketAndOptions(...args);
    // console.log(bucketName, fileName, options, error);
    if (error !== null) {
      return { value: null, error: error as string };
    }

    const r = await this.checkBucket(bucketName);
    if (r.error !== null) {
      return { value: null, error: r.error };
    }
    const r2 = await this.checkFile(r.value as string, fileName as string);
    if (r2.error !== null) {
      return { value: null, error: r2.error };
    }

    return this._getFileAsStream(
      r.value as string,
      fileName as string,
      options === null ? {} : (options as StreamOptions)
    );
  }

  public async getPublicURL(
    ...args:
      | [bucketName: string, fileName: string, options?: Options]
      | [fileName: string, options?: Options]
  ): Promise<ResultObject> {
    const { bucketName, fileName, options: opt, error } = this.getFileAndBucketAndOptions(...args);
    if (error !== null) {
      return { value: null, error: error as string };
    }
    const r = await this.checkBucket(bucketName);
    if (r.error !== null) {
      return { value: null, error: r.error };
    }
    const r2 = await this.checkFile(r.value as string, fileName as string);
    if (r2.error !== null) {
      return { value: null, error: r2.error };
    }
    const options = opt === null ? {} : (opt as Options);
    return this._getPublicURL(r.value as string, fileName as string, options);
  }

  public async getSignedURL(
    ...args:
      | [bucketName: string, fileName: string, options?: Options]
      | [fileName: string, options?: Options]
  ): Promise<ResultObject> {
    const { bucketName, fileName, options, error } = this.getFileAndBucketAndOptions(...args);
    if (error !== null) {
      return { value: null, error: error as string };
    }
    const r = await this.checkBucket(bucketName);
    if (r.error !== null) {
      return { value: null, error: r.error };
    }
    const r2 = await this.checkFile(r.value as string, fileName as string);
    if (r2.error !== null) {
      return { value: null, error: r2.error };
    }
    return this._getSignedURL(
      r.value as string,
      fileName as string,
      options === null ? {} : (options as Options)
    );
  }

  public async sizeOf(
    ...args: [bucketName: string, fileName: string] | [fileName: string]
  ): Promise<ResultObjectNumber> {
    const { bucketName, fileName, options: _o, error } = this.getFileAndBucketAndOptions(...args);
    if (error !== null) {
      return { value: null, error: error as string };
    }
    const r = await this.checkBucket(bucketName);
    if (r.error !== null) {
      return { value: null, error: r.error };
    }
    const r2 = await this.checkFile(r.value as string, fileName as string);
    if (r2.error !== null) {
      return { value: null, error: r2.error };
    }
    return this._sizeOf(r.value as string, fileName as string);
  }

  public async fileExists(
    ...args: [bucketName: string, fileName: string] | [fileName: string]
  ): Promise<ResultObjectBoolean> {
    const { bucketName, fileName, options: _o, error } = this.getFileAndBucketAndOptions(...args);
    if (error !== null) {
      return { value: null, error: error as string };
    }
    const r = await this.checkBucket(bucketName);
    if (r.error !== null) {
      return { value: null, error: r.error };
    }
    return this._fileExists(r.value as string, fileName as string);
  }

  public async removeFile(
    ...args: [bucketName: string, fileName: string] | [fileName: string]
  ): Promise<ResultObject> {
    const {
      bucketName,
      fileName,
      options: _allVersions,
      error,
    } = this.getFileAndBucketAndOptions(...args);
    if (error !== null) {
      return { value: null, error: error as string };
    }

    const r = await this.checkBucket(bucketName);
    if (r.error !== null) {
      return { value: null, error: r.error };
    }

    // check if file exists, this is especially necessary for Backblaze B2 with S3 adapter!
    const r2 = await this.checkFile(r.value as string, fileName as string);
    if (r2.error !== null) {
      if (r2.error.startsWith(`No file '${fileName}' found in bucket`)) {
        return { value: r2.error, error: null };
      } else {
        return { value: null, error: r2.error };
      }
    }

    return this._removeFile(bucketName as string, fileName as string);
  }

  public async getPresignedUploadURL(
    ...args:
      | [bucketName: string, fileName: string, options?: Options]
      | [fileName: string, options?: Options]
  ): Promise<ResultObjectObject> {
    const { bucketName, fileName, options, error } = this.getFileAndBucketAndOptions(...args);
    if (error !== null) {
      return { value: null, error: error as string };
    }
    const r = await this.checkBucket(bucketName);
    if (r.error !== null) {
      return { value: null, error: r.error };
    }
    return this._getPresignedUploadURL(r.value as string, fileName as string, options as object);
  }
}
