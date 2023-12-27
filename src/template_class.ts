import fs from "fs";
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
// Use ConfigTemplate as starting point for your own configuration object
import {
  ResultObject,
  FilePathParams,
  FileBufferParams,
  FileStreamParams,
  ResultObjectBoolean,
  ResultObjectFiles,
  ResultObjectBuckets,
  ResultObjectNumber,
  Options,
  ResultObjectStream,
} from "./types";
import { parseUrl, validateName } from "./util";
import { AdapterConfig } from "@tweedegolf/storage-abstraction";

export class AdapterTemplate extends AbstractAdapter {
  // Your storage type, add this type to the enum StorageType in ./types.ts
  protected _type: string;

  // The instance of the service client if you use another library as a wrapper
  // around the API of your storage service, e.g. aws-sdk for Amazon S3.
  protected _client: any; // eslint-disable-line

  // The constructor can take both a string and an object. You should define an interface
  // for the object that extends IConfig, see the file ./types.ts. You can use any name
  // for your interface but it is convenient if you start your name with Config and then
  // the name of your storage service in camelcase, e.g. ConfigMyStorageType.
  constructor(config: string | AdapterConfig) {
    super();
    if (typeof config === "string") {
      // you may want to implement your own parser instead of the default query string parser
      const { value, error } = parseUrl(config);
      if (error) {
        this._configError = `[configError] ${error}`;
      }
      this._config = value;
    } else {
      this._config = { ...config };
    }

    // you might need to perform some extra checks
    if (!this._config?.someKey || !this._config?.someOtherKey) {
      throw new Error(
        "You must specify a value for both 'someKey' and  'someOtherKey' for storage type 'yourtype'"
      );
    }

    // If you are using a wrapper library, create an instance here
    this._client = new WrapperLibrary(this._config);
  }

  async getFileAsStream(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObjectStream> {
    // Return a stream that you've created somehow in your adapter or that you pipe
    // directly from your cloud storage.
    const r: Readable = fs.createReadStream("path");
    return { value: r, error: null };
  }

  async getFileAsURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    // Return a public url to the file. Note that you might need extra right to
    // be able to create a public url. In the options object you can pass extra
    // parameters such as an expiration date of the url
    return { value: "https://public.url.to.your.file", error: null };
  }

  async removeFile(bucketName: string, fileName: string): Promise<ResultObject> {
    return { value: "ok", error: null };
  }

  // In the super class AbstractStorage there are 3 API methods connected to `addFile()`:
  // The API methods are:
  // 1. addFileFromPath
  // 2. addFileFromBuffer
  // 3. addFileFromStream
  async addFile(params: FilePathParams): Promise<ResultObject>;
  async addFile(params: FileBufferParams): Promise<ResultObject>;
  async addFile(params: FileStreamParams): Promise<ResultObject>;
  async addFile(
    params: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    return { value: "ok", error: null };
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

  async createBucket(name: string): Promise<ResultObject> {
    // You can use the validateName method of AbstractStorage to check for
    // invalid entries or write your own code to do it.
    // The function validateName is defined in ./util.js
    const msg = validateName(name);
    if (msg !== null) {
      return Promise.reject(msg);
    }

    // Create bucket, if bucket has been created successfully you could
    // add it to this.bucketNames so you don't have to check its existence
    // again.
    return { value: "ok", error: null };
  }

  async clearBucket(name: string): Promise<ResultObject> {
    return { value: "ok", error: null };
  }

  async deleteBucket(name: string): Promise<ResultObject> {
    return { value: "ok", error: null };
  }

  // Returns the names of all existing buckets, should may be renamed to listBucketNames
  async listBuckets(): Promise<ResultObjectBuckets> {
    return {
      value: ["bucket1", "bucket2"],
      error: null,
    };
  }

  async listFiles(bucketName: string, numFiles: number = 1000): Promise<ResultObjectFiles> {
    return {
      value: [
        ["file.txt", 3000],
        ["image.jpg", 4567],
      ],
      error: null,
    };
  }

  async sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    return { value: 42, error: null };
  }

  async bucketExists(bucketName: string): Promise<ResultObjectBoolean> {
    return { value: true, error: null };
  }

  async fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    return { value: true, error: null };
  }
}

// stub of a 3rd-party service client library to silence ts-lint
export const WrapperLibrary = function (config: string | AdapterConfig) {};
