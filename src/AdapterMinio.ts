import * as Minio from "minio";
import fs from "fs";
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
import {
  AdapterConfigMinIO,
  FileBufferParams,
  FilePathParams,
  FileStreamParams,
  Options,
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectStream,
  StorageType,
  StreamOptions,
} from "./types";
import { validateName } from "./util";

export class AdapterMinio extends AbstractAdapter {
  protected _type = StorageType.MINIO;
  protected _client: Minio.Client;
  protected _configError: string | null = null;
  protected _config: AdapterConfigMinIO;

  constructor(config: string | AdapterConfigMinIO) {
    super(config);
    if (this._configError === null) {
      if (
        this.config.accessKey === "undefined" ||
        this.config.secretKey === "undefined" ||
        this.config.endPoint === "undefined"
      ) {
        this._configError = 'Please provide a value for "accessKey", "secretKey and "endPoint"';
      } else {
        const useSSL = this.config.useSSL;
        if (typeof useSSL !== "boolean") {
          this.config.useSSL = true;
        }
        const port = this.config.port;
        if (typeof port !== "number") {
          this.config.port = useSSL ? 443 : 80;
        }
        const region = this.config.region;
        if (typeof region !== "string") {
          this.config.region = "auto";
        }
        // console.log(useSSL, port, region);
        const c = {
          endPoint: this.config.endPoint,
          region: this.config.region,
          port: this.config.port,
          useSSL: this.config.useSSL,
          accessKey: this.config.accessKey,
          secretKey: this.config.secretKey,
        };
        this._client = new Minio.Client(c);
      }
    }
  }

  get config(): AdapterConfigMinIO {
    return this._config as AdapterConfigMinIO;
  }

  get serviceClient(): Minio.Client {
    return this._client as Minio.Client;
  }

  public async getFileAsStream(
    bucketName: string,
    fileName: string,
    options?: StreamOptions
  ): Promise<ResultObjectStream> {
    if (this.configError !== null) {
      return { error: this.configError, value: null };
    }

    let offset = 0;
    let length: number;
    const { start, end } = options;
    if (typeof start !== "undefined" && typeof end !== "undefined") {
      offset = start;
      length = end - start;
    } else if (typeof start === "undefined") {
      offset = 0;
    }

    try {
      const stream = await this._client.getPartialObject(bucketName, fileName, offset, length);
      return { value: stream, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async removeFile(bucketName: string, fileName: string): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      await this._client.removeObject(bucketName, fileName);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async createBucket(name: string, options: Options = {}): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    const error = validateName(name);
    if (error !== null) {
      return { value: null, error };
    }

    try {
      const e = await this._client.bucketExists(name);
      if (e) {
        return { value: null, error: "bucket exists" };
      }
    } catch (e) {
      return { value: null, error: e.message };
    }

    try {
      const { region } = this._config;
      await this._client.makeBucket(name, region, options as Minio.MakeBucketOpt);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async clearBucket(name: string): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    const { value: files, error } = await this.listFiles(name);
    if (error !== null) {
      return { value: null, error };
    }

    try {
      await this._client.removeObjects(
        name,
        files.map((t) => t[0])
      );
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async deleteBucket(name: string): Promise<ResultObject> {
    try {
      await this.clearBucket(name);
      await this._client.removeBucket(name);
      return { value: "ok", error: null };
    } catch (e) {
      console.log(e.message);
      if (e.message === "NoSuchBucket") {
        return { value: "bucket not found", error: null };
      }
      return { value: null, error: e.message };
    }
  }

  public async listBuckets(): Promise<ResultObjectBuckets> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const buckets = await this._client.listBuckets();
      return { value: buckets.map((b) => b.name), error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async addFile(
    params: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    let { options } = params;
    if (typeof options !== "object") {
      options = {};
    }

    try {
      let fileData: Readable | Buffer;
      if (typeof (params as FilePathParams).origPath !== "undefined") {
        const f = (params as FilePathParams).origPath;
        if (!fs.existsSync(f)) {
          return { value: null, error: `File with given path: ${f}, was not found` };
        }
        fileData = fs.createReadStream(f);
      } else if (typeof (params as FileBufferParams).buffer !== "undefined") {
        fileData = (params as FileBufferParams).buffer;
      } else if (typeof (params as FileStreamParams).stream !== "undefined") {
        fileData = (params as FileStreamParams).stream;
      }

      const { bucketName, targetPath } = params;
      const response = await this._client.putObject(bucketName, targetPath, fileData, options);
      return this.getFileAsURL(params.bucketName, params.targetPath);
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async getFileAsURL(
    bucketName: string,
    fileName: string,
    options?: Options // e.g. { expiry: 3600 }
  ): Promise<ResultObject> {
    try {
      const url = await this._client.presignedUrl(
        "GET",
        bucketName,
        fileName,
        options.expiry || null,
        options
      );
      return { value: url, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async listFiles(bucketName: string, maxFiles: number = 10000): Promise<ResultObjectFiles> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const stream = this._client.listObjectsV2(bucketName, "", true);
      const files: Array<[string, number]> = [];
      const { error: streamError } = await new Promise<ResultObjectFiles>((resolve) => {
        stream.on("data", function (obj) {
          files.push([obj.name, obj.size]);
        });
        stream.on("end", function () {
          resolve({ value: files, error: null });
        });
        stream.on("error", function (e) {
          resolve({ value: null, error: e.message });
        });
      });
      if (streamError !== null) {
        return { value: null, error: streamError };
      }
      return { value: files, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const stats = await this._client.statObject(bucketName, fileName);
      return { value: stats.size, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async bucketExists(bucketName: string): Promise<ResultObjectBoolean> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const exists = await this._client.bucketExists(bucketName);
      return { value: exists, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const stats = await this._client.statObject(bucketName, fileName);
      return { value: stats !== null, error: null };
    } catch (e) {
      return { value: false, error: null };
    }
  }
}
