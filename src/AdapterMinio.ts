import fs from "fs";
import * as Minio from "minio";
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
import { Options, StreamOptions, StorageType } from "./types/general";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params";
import {
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectStream,
} from "./types/result";
import { AdapterConfigMinio } from "./types/adapter_minio";
import { parseUrl, validateName } from "./util";

export class AdapterMinio extends AbstractAdapter {
  protected _type = StorageType.MINIO;
  protected _client: Minio.Client;
  protected _configError: string | null = null;
  protected _config: AdapterConfigMinio;

  constructor(config: string | AdapterConfigMinio) {
    super(config);
    if (typeof config !== "string") {
      this._config = { ...config };
    } else {
      const { value, error } = parseUrl(config);
      if (error !== null) {
        this._configError = `[configError] ${error}`;
      } else {
        const {
          protocol: type,
          username: accessKey,
          password: secretKey,
          host: bucketName,
          searchParams,
        } = value;
        let endPoint: string;
        if (searchParams !== null) {
          ({ endPoint } = searchParams);
          delete searchParams.endPoint;
          this._config = { type, accessKey, secretKey, endPoint, ...searchParams };
        } else {
          this._config = { type, accessKey, secretKey, endPoint };
        }
        if (bucketName !== null) {
          this._config.bucketName = bucketName;
        }
      }
      // console.log(this._config);
    }

    if (!this.config.accessKey || !this.config.secretKey || !this.config.endPoint) {
      this._configError = 'Please provide a value for "accessKey", "secretKey and "endPoint"';
    } else {
      const useSSL = this.config.useSSL;
      if (typeof useSSL === "undefined") {
        this.config.useSSL = true;
      }
      if (typeof useSSL === "string") {
        this.config.useSSL = useSSL === "true";
      }
      const port = this.config.port;
      if (typeof port === "undefined") {
        this.config.port = this.config.useSSL ? 443 : 80;
      }
      if (typeof port === "string") {
        this.config.port = parseInt(port, 10);
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
      // console.log(c);
      try {
        this._client = new Minio.Client(c);
      } catch (e) {
        this._configError = `[configError] ${e.message}`;
      }
    }

    if (typeof this.config.bucketName !== "undefined") {
      this._bucketName = this.config.bucketName;
    }
  }

  // protected, called by methods of public API via AbstractAdapter

  protected async _listBuckets(): Promise<ResultObjectBuckets> {
    try {
      const buckets = await this._client.listBuckets();
      return { value: buckets.map((b) => b.name), error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _createBucket(name: string, options: Options): Promise<ResultObject> {
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

  protected async _getFileAsStream(
    bucketName: string,
    fileName: string,
    options: StreamOptions
  ): Promise<ResultObjectStream> {
    const { start, end } = options;
    let offset: number;
    let length: number;
    if (typeof start !== "undefined") {
      offset = start;
    } else {
      offset = 0;
    }
    if (typeof end !== "undefined") {
      length = end - offset + 1;
    }

    try {
      let stream: Readable;
      if (typeof length !== "undefined") {
        stream = await this._client.getPartialObject(bucketName, fileName, offset, length);
      } else {
        stream = await this._client.getPartialObject(bucketName, fileName, offset);
      }
      return { value: stream, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _removeFile(
    bucketName: string,
    fileName: string,
    allVersions: boolean
  ): Promise<ResultObject> {
    try {
      await this._client.removeObject(bucketName, fileName);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _clearBucket(name: string): Promise<ResultObject> {
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

  protected async _deleteBucket(name: string): Promise<ResultObject> {
    try {
      await this.clearBucket(name);
      await this._client.removeBucket(name);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _addFile(
    params: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    try {
      let fileData: Readable | Buffer;
      let size: number;
      if (typeof (params as FilePathParams).origPath !== "undefined") {
        const f = (params as FilePathParams).origPath;
        if (!fs.existsSync(f)) {
          return { value: null, error: `File with given path: ${f}, was not found` };
        }
        try {
          const stats = await fs.promises.stat(f);
          size = stats.size;
        } catch (e) {
          return { value: null, error: `Cannot access file ${f} Error: ${e}` };
        }
        fileData = fs.createReadStream(f);
      } else if (typeof (params as FileBufferParams).buffer !== "undefined") {
        fileData = (params as FileBufferParams).buffer;
        size = fileData.buffer.byteLength;
      } else if (typeof (params as FileStreamParams).stream !== "undefined") {
        fileData = (params as FileStreamParams).stream;
      }

      const { bucketName, targetPath } = params;
      const response = await this._client.putObject(
        bucketName,
        targetPath,
        fileData,
        size,
        params.options
      );
      return this.getFileAsURL(params.bucketName, params.targetPath, params.options);
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  /**
   * @deprecated: use getPublicURL or getSignedURL
   */
  protected async _getFileAsURL(
    bucketName: string,
    fileName: string,
    options: Options // e.g. { expiry: 3600 }
  ): Promise<ResultObject> {
    const expiry = options.expiry || 7 * 24 * 60 * 60;
    let url = "";
    try {
      if (options.useSignedUrl) {
        url = await this._client.presignedUrl("GET", bucketName, fileName, expiry, options);
      } else {
        url = `https://${this.config.endPoint}/`;
        if (this.config.port) {
          url += `:${this.config.port}`;
        }
        url += `/${bucketName}/${fileName}`;
      }

      return { value: url, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _getPublicURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    return Promise.resolve({ value: "", error: null });
  }

  protected async _getSignedURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    return Promise.resolve({ value: "", error: null });
  }

  protected async _listFiles(bucketName: string, numFiles: number): Promise<ResultObjectFiles> {
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

  protected async _sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    try {
      const stats = await this._client.statObject(bucketName, fileName);
      return { value: stats.size, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _bucketExists(bucketName: string): Promise<ResultObjectBoolean> {
    try {
      const exists = await this._client.bucketExists(bucketName);
      return { value: exists, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _bucketIsPublic(
    bucketName?: string,
  ): Promise<ResultObjectBoolean> {
    return Promise.resolve({ value: true, error: null });
  }

  protected async _fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    try {
      const stats = await this._client.statObject(bucketName, fileName);
      return { value: stats !== null, error: null };
    } catch (e) {
      return { value: false, error: null };
    }
  }

  // public

  get config(): AdapterConfigMinio {
    return this._config as AdapterConfigMinio;
  }

  public getConfig(): AdapterConfigMinio {
    return this._config as AdapterConfigMinio;
  }

  get serviceClient(): Minio.Client {
    return this._client as Minio.Client;
  }

  public getServiceClient(): Minio.Client {
    return this._client as Minio.Client;
  }
}
