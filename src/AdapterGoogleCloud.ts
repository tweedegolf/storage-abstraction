import fs from "fs";
import { Readable } from "stream";
import { Storage as GoogleCloudStorage } from "@google-cloud/storage";
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
import { AdapterConfigGoogleCloud } from "./types/adapter_google_cloud";
import { parseUrl, validateName } from "./util";

export class AdapterGoogleCloud extends AbstractAdapter {
  protected _type = StorageType.GCS;
  protected _config: AdapterConfigGoogleCloud;
  protected _configError: string | null = null;
  protected _client: GoogleCloudStorage;

  constructor(config?: string | AdapterConfigGoogleCloud) {
    super(config);
    if (typeof config !== "string") {
      this._config = { ...config };
      if (typeof config.bucketName !== "undefined") {
        this._bucketName = config.bucketName;
      }
    } else {
      const { value, error } = parseUrl(config);
      if (error !== null) {
        this._configError = `[configError] ${error}`;
      } else {
        const { type, part1, bucketName, extraOptions } = value;
        if (extraOptions !== null) {
          this._config = { type, ...extraOptions };
        } else {
          this._config = { type };
        }
        if (part1 !== null) {
          this._config.accessKeyId = part1;
        }
        if (bucketName !== null) {
          this._config.bucketName = bucketName;
        }
      }
    }

    try {
      this._client = new GoogleCloudStorage(this._config as object);
    } catch (e) {
      this._configError = `[configError] ${e.message}`;
    }
  }

  // protected, called by methods of public API via AbstractAdapter

  protected async _getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject> {
    try {
      const file = this._client.bucket(bucketName).file(fileName);
      return { value: file.publicUrl(), error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _getFileAsStream(
    bucketName: string,
    fileName: string,
    options: StreamOptions
  ): Promise<ResultObjectStream> {
    try {
      const file = this._client.bucket(bucketName).file(fileName);
      const [exists] = await file.exists();
      if (exists) {
        return { value: file.createReadStream(options as object), error: null };
      } else {
        return {
          value: null,
          error: `File '${fileName}' does not exist in bucket '${bucketName}'.`,
        };
      }
    } catch (e) {
      return {
        value: null,
        error: `File ${fileName} could not be retrieved from bucket ${bucketName}`,
      };
    }
  }

  protected async _removeFile(
    bucketName: string,
    fileName: string,
    allVersions: boolean
  ): Promise<ResultObject> {
    try {
      const file = this._client.bucket(bucketName).file(fileName);
      const [exists] = await file.exists();
      if (exists) {
        await this._client.bucket(bucketName).file(fileName).delete();
        return { value: "ok", error: null };
      }
      // no fail if the file does not exist
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _addFile(
    params: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    try {
      let readStream: Readable;
      if (typeof (params as FilePathParams).origPath === "string") {
        const f = (params as FilePathParams).origPath;
        if (!fs.existsSync(f)) {
          return { value: null, error: `File with given path: ${f}, was not found` };
        }
        readStream = fs.createReadStream(f);
      } else if (typeof (params as FileBufferParams).buffer !== "undefined") {
        readStream = new Readable();
        readStream._read = (): void => {}; // _read is required but you can noop it
        readStream.push((params as FileBufferParams).buffer);
        readStream.push(null);
      } else if (typeof (params as FileStreamParams).stream !== "undefined") {
        readStream = (params as FileStreamParams).stream;
      }

      const file = this._client.bucket(params.bucketName).file(params.targetPath, params.options);
      const writeStream = file.createWriteStream(params.options);
      return new Promise((resolve) => {
        readStream
          .pipe(writeStream)
          .on("error", (e: Error) => {
            resolve({ value: null, error: e.message });
          })
          .on("finish", () => {
            resolve({ value: file.publicUrl(), error: null });
          });
        writeStream.on("error", (e: Error) => {
          resolve({ value: null, error: e.message });
        });
      });
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _listFiles(bucketName: string, numFiles: number): Promise<ResultObjectFiles> {
    try {
      const data = await this._client.bucket(bucketName).getFiles();
      return {
        value: data[0].map((f) => [f.name, parseInt(f.metadata.size as string, 10)]),
        error: null,
      };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    try {
      const file = this._client.bucket(bucketName).file(fileName);
      const [metadata] = await file.getMetadata();
      return { value: parseInt(metadata.size as string, 10), error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _bucketExists(name: string): Promise<ResultObjectBoolean> {
    try {
      const data = await this._client.bucket(name).exists();
      // console.log(data);
      return { value: data[0], error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    try {
      const data = await this._client.bucket(bucketName).file(fileName).exists();
      // console.log(data);
      return { value: data[0], error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _deleteBucket(name: string): Promise<ResultObject> {
    try {
      await this.clearBucket(name);
    } catch (e) {
      return { value: null, error: e.message };
    }
    try {
      await this._client.bucket(name).delete();
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _clearBucket(name: string): Promise<ResultObject> {
    try {
      await this._client.bucket(name).deleteFiles({ force: true });
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  //public

  get config(): AdapterConfigGoogleCloud {
    return this._config as AdapterConfigGoogleCloud;
  }

  getConfig(): AdapterConfigGoogleCloud {
    return this._config as AdapterConfigGoogleCloud;
  }

  get serviceClient(): GoogleCloudStorage {
    return this._client as GoogleCloudStorage;
  }

  getServiceClient(): GoogleCloudStorage {
    return this._client as GoogleCloudStorage;
  }

  public async listBuckets(): Promise<ResultObjectBuckets> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const [buckets] = await this._client.getBuckets();
      return { value: buckets.map((b) => b.name), error: null };
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
      const bucket = this._client.bucket(name, options);
      const [exists] = await bucket.exists();
      if (exists) {
        return { value: null, error: "bucket exists" };
      }
    } catch (e) {
      return { value: null, error: e.message };
    }

    try {
      await this._client.createBucket(name, options);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }
}
