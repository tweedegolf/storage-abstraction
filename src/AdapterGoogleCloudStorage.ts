import fs from "fs";
import { Readable } from "stream";
import { Storage as GoogleCloudStorage } from "@google-cloud/storage";
import { AbstractAdapter } from "./AbstractAdapter";
import {
  StorageType,
  ResultObject,
  ResultObjectStream,
  FileBufferParams,
  FilePathParams,
  FileStreamParams,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectBoolean,
  AdapterConfigGoogle,
  Options,
  StreamOptions,
} from "./types";

export class AdapterGoogleCloudStorage extends AbstractAdapter {
  protected _type = StorageType.GCS;
  protected _config: AdapterConfigGoogle;
  protected _configError: string | null = null;
  protected _client: GoogleCloudStorage;

  constructor(config?: string | AdapterConfigGoogle) {
    super(config);
    if (this._configError === null) {
      this._client = new GoogleCloudStorage(this._config as object);
    }
  }

  // util method used by listFiles
  private async getFileSize(bucketName: string, fileNames: string[]): Promise<ResultObjectFiles> {
    const result: Array<[string, number]> = [];
    for (let i = 0; i < fileNames.length; i += 1) {
      const file = this.storage.bucket(bucketName).file(fileNames[i]);
      try {
        const [metadata] = await file.getMetadata();
        result.push([file.name, parseInt(metadata.size as string, 10)]);
      } catch (e) {
        return { value: null, error: e.message };
      }
    }
    return { value: result, error: null };
  }

  get config(): AdapterConfigGoogle {
    return this._config as AdapterConfigGoogle;
  }

  get storage(): GoogleCloudStorage {
    return this._client as GoogleCloudStorage;
  }

  public async getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const file = this.storage.bucket(bucketName).file(fileName);
      return { value: file.publicUrl(), error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async getFileAsStream(
    bucketName: string,
    fileName: string,
    options?: StreamOptions
  ): Promise<ResultObjectStream> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const file = this.storage.bucket(bucketName).file(fileName);
      const [exists] = await file.exists();
      if (exists) {
        return { value: file.createReadStream(options as object), error: null };
      }
    } catch (e) {
      return {
        value: null,
        error: `File ${fileName} could not be retrieved from bucket ${bucketName}`,
      };
    }
  }

  public async removeFile(bucketName: string, fileName: string): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      await this.storage.bucket(bucketName).file(fileName).delete();
      return { value: "ok", error: null };
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

      const file = this.storage.bucket(params.bucketName).file(params.targetPath, options);
      const writeStream = file.createWriteStream(options);
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

  public async createBucket(name: string, options: object = {}): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const bucket = this.storage.bucket(name, options);
      const [exists] = await bucket.exists();
      if (exists) {
        return { value: null, error: "bucket exists" };
      }
    } catch (e) {
      // console.log(e.message);
      // just move on
    }

    try {
      await this.storage.createBucket(name, options);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async clearBucket(name: string): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      await this.storage.bucket(name).deleteFiles({ force: true });
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async deleteBucket(name: string): Promise<ResultObject> {
    try {
      await this.clearBucket(name);
    } catch (e) {
      return { value: null, error: e.message };
    }
    try {
      await this.storage.bucket(name).delete();
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async listBuckets(): Promise<ResultObjectBuckets> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const [buckets] = await this.storage.getBuckets();
      return { value: buckets.map((b) => b.name), error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async listFiles(bucketName: string, numFiles: number = 1000): Promise<ResultObjectFiles> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const data = await this.storage.bucket(bucketName).getFiles();
      const names = data[0].map((f) => f.name);
      return this.getFileSize(bucketName, names);
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const file = this.storage.bucket(bucketName).file(fileName);
      const [metadata] = await file.getMetadata();
      return { value: parseInt(metadata.size as string, 10), error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async bucketExists(name: string): Promise<ResultObjectBoolean> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const data = await this.storage.bucket(name).exists();
      // console.log(data);
      return { value: data[0], error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const data = await this.storage.bucket(bucketName).file(fileName).exists();
      // console.log(data);
      return { value: data[0], error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }
}
