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

  set(bucketName: string) {
    this._bucketName = bucketName;
  }

  get bucketName(): string {
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

  protected _removeFile(
    arg1: string,
    arg2: string | boolean,
    arg3: boolean
  ): { bucketName: string; fileName: string; allVersions: boolean; error: string } {
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
          bucketName: null,
          fileName: null,
          allVersions: null,
          error: "No bucket selected",
        };
      }
      bucketName = this._bucketName;
      fileName = arg1;
      if (typeof arg2 === "boolean") {
        allVersions = arg2;
      }
    }
    return {
      bucketName,
      fileName,
      allVersions,
      error: null,
    };
  }

  protected _listFiles(
    arg1: number | string,
    arg2: number
  ): { bucketName: string; maxFiles: number; error: string } {
    let bucketName: string;
    let maxFiles: number = 10000;

    if (typeof arg1 === "number") {
      if (this._bucketName === null) {
        return {
          bucketName: null,
          maxFiles,
          error: "no bucket selected",
        };
      }
      bucketName = this._bucketName;
      maxFiles = arg1;
    } else if (typeof arg1 === "string") {
      bucketName = arg1;
      if (typeof arg2 === "number") {
        maxFiles = arg2;
      }
    } else {
      if (this._bucketName === null) {
        return {
          bucketName: null,
          maxFiles,
          error: "no bucket selected",
        };
      }
      bucketName = this._bucketName;
    }
    return {
      bucketName,
      maxFiles,
      error: null,
    };
  }

  protected _getFileAsURL(
    arg1: string,
    arg2: Options | string,
    arg3: Options
  ): { bucketName: string; fileName: string; options: Options; error: string } {
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
          bucketName: null,
          fileName: null,
          options: null,
          error: "no bucket selected",
        };
      }
      bucketName = this._bucketName;
      fileName = arg1;
      if (typeof arg2 !== "undefined") {
        options = arg2;
      }
    }
    return {
      bucketName,
      fileName,
      options,
      error: null,
    };
  }
  protected _getFileAsStream(
    arg1: string,
    arg2: StreamOptions | string,
    arg3: StreamOptions
  ): { bucketName: string; fileName: string; options: StreamOptions; error: string } {
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
          bucketName: null,
          fileName: null,
          options: null,
          error: "no bucket selected",
        };
      }
      bucketName = this._bucketName;
      fileName = arg1;
      if (typeof arg2 !== "undefined") {
        options = arg2;
      }
    }
    return {
      bucketName,
      fileName,
      options,
      error: null,
    };
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

  abstract listBuckets(): Promise<ResultObjectBuckets>;

  // abstract listFiles(bucketName: string, numFiles?: number): Promise<ResultObjectFiles>;
  // abstract listFiles(numFiles?: number): Promise<ResultObjectFiles>;
  abstract listFiles(arg1?: number | string, arg2?: number): Promise<ResultObjectFiles>;

  abstract getFileAsStream(
    arg1: string,
    arg2?: StreamOptions | string,
    arg3?: StreamOptions
  ): Promise<ResultObjectStream>;

  abstract getFileAsURL(
    arg1: string,
    arg2?: Options | string,
    arg3?: Options
  ): Promise<ResultObject>;

  abstract clearBucket(name?: string): Promise<ResultObject>;

  abstract deleteBucket(name?: string): Promise<ResultObject>;

  abstract sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;

  abstract fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>;

  abstract removeFile(
    bucketName: string,
    fileName: string,
    allVersions?: boolean
  ): Promise<ResultObject>;
  abstract removeFile(fileName: string, allVersions?: boolean): Promise<ResultObject>;

  abstract bucketExists(name: string): Promise<ResultObjectBoolean>;
}
