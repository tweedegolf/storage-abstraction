import B2 from "backblaze-b2";
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
import {
  StorageType,
  BackblazeB2File,
  ResultObjectBoolean,
  ResultObject,
  ResultObjectStream,
  ResultObjectBucketsB2,
  ResultObjectFilesB2,
  ResultObjectBucketB2,
  ResultObjectFileB2,
  FileB2,
  FileBufferParams,
  FileStreamParams,
  FilePathParams,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  BackblazeAxiosResponse,
  BackblazeBucketOptions,
  AdapterConfig,
} from "./types";
import { validateName } from "./util";

require("@gideo-llc/backblaze-b2-upload-any").install(B2);

export class AdapterBackblazeB2 extends AbstractAdapter {
  protected _type = StorageType.B2;
  protected _config: AdapterConfig;
  protected _configError: string | null = null;
  private storage: B2 = null;
  private authorized: boolean = false;

  constructor(config?: string | AdapterConfig) {
    super(config);
    if (this._configError === null) {
      try {
        this.storage = new B2(this._config);
      } catch (e) {
        this._configError = e.message;
      }
    }
  }

  // util members

  private async authorize(): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }
    if (this.authorized) {
      return { value: "ok", error: null };
    }

    return this.storage
      .authorize()
      .then((r: BackblazeAxiosResponse) => {
        // console.log(r.data.allowed.capabilities);
        this.authorized = true;
        return { value: "ok", error: null };
      })
      .catch((r: BackblazeAxiosResponse) => {
        return { value: null, error: r.response.data.message };
      });
  }

  private async getBuckets(): Promise<ResultObjectBucketsB2> {
    return this.storage
      .listBuckets()
      .then(({ data: { buckets } }) => {
        const value = buckets.map(({ bucketId, bucketName }) => {
          return {
            id: bucketId,
            name: bucketName,
          };
        });
        return { value, error: null };
      })
      .catch((r: BackblazeAxiosResponse) => {
        return { value: null, error: r.response.data.message };
      });
  }

  private async getBucket(name: string): Promise<ResultObjectBucketB2> {
    const { value: buckets, error } = await this.getBuckets();
    if (error !== null) {
      return { value: null, error };
    }

    for (let i = 0; i < buckets.length; i++) {
      const bucket = buckets[i];
      if (bucket.name === name) {
        return { value: bucket, error: null };
      }
    }
    return { value: null, error: `Could not find bucket "${name}"` };
  }

  private async getFiles(bucketName: string): Promise<ResultObjectFilesB2> {
    const { value: bucket, error } = await this.getBucket(bucketName);
    if (error !== null) {
      return { error, value: null };
    }

    return this.storage
      .listFileVersions({
        bucketId: bucket.id,
        maxFileCount: 1000,
      })
      .then(({ data: { files } }) => {
        // console.log(files);
        const value = files.map(({ fileId, fileName, contentType, contentLength }) => {
          return {
            id: fileId,
            name: fileName,
            contentType,
            contentLength,
          };
        });
        return { value, error: null };
      })
      .catch((r: BackblazeAxiosResponse) => {
        return { value: null, error: r.response.data.message };
      });
  }

  private async getFile(bucketName: string, name: string): Promise<ResultObjectFileB2> {
    const { value: files, error } = await this.getFiles(bucketName);
    if (error !== null) {
      return { error, value: null };
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name === name) {
        return { value: file, error: null };
      }
    }
    return { value: null, error: `Could not find file "${name}" in bucket "${bucketName}".` };
  }

  // public API

  public async addFile(
    params: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const { bucketName, targetPath } = params;
    const data = await this.getBucket(bucketName);
    if (data.error !== null) {
      return { error: data.error, value: null };
    }
    const { value: bucket } = data;

    let { options } = params;
    if (typeof options === "undefined") {
      options = {};
    }

    let fileData: string | Buffer | Readable;
    if (typeof (params as FilePathParams).origPath !== "undefined") {
      fileData = (params as FilePathParams).origPath;
    } else if (typeof (params as FileBufferParams).buffer !== "undefined") {
      fileData = (params as FileBufferParams).buffer;
    } else if (typeof (params as FileStreamParams).stream !== "undefined") {
      fileData = (params as FileStreamParams).stream;
    }

    return this.storage
      .uploadAny({
        ...options,
        bucketId: bucket.id,
        fileName: targetPath,
        data: fileData,
      })
      .then((file: BackblazeB2File) => {
        // console.log(file);
        return {
          error: null,
          value: `${this.storage.downloadUrl}/file/${bucketName}/${targetPath}`,
        };
      })
      .catch((r: BackblazeAxiosResponse) => {
        return { error: r.response.data.message, value: null };
      });
  }

  public async getFileAsStream(
    bucketName: string,
    fileName: string,
    options: { start?: number; end?: number } = { start: 0 }
  ): Promise<ResultObjectStream> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const data = await this.getFile(bucketName, fileName);
    if (data.error !== null) {
      return { error: data.error, value: null };
    }
    const { value: file } = data;
    return this.storage
      .downloadFileById({
        fileId: file.id,
        responseType: "stream",
        axios: {
          headers: {
            "Content-Type": file.contentType,
            Range: `bytes=${options.start}-${options.end || ""}`,
          },
        },
      })
      .then((r: { data: Readable }) => {
        return { error: null, value: r.data };
      });
  }

  public async getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const url = `${this.storage.downloadUrl}/file/${bucketName}/${fileName}`;
    return { value: url, error: null };
  }

  public async removeFile(bucketName: string, fileName: string): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const data = await this.getFiles(bucketName);
    if (error !== null) {
      return { error, value: null };
    }

    const { value: files } = data;
    const index = files.findIndex(({ name }) => name === fileName);
    if (index === -1) {
      return { error: `Could not find file "${fileName}"`, value: null };
    }
    const file = files[index];

    return Promise.all(
      files
        .filter((f: FileB2) => f.name === fileName)
        .map(({ id: fileId, name: fileName }) =>
          this.storage.deleteFileVersion({
            fileId,
            fileName,
          })
        )
    )
      .then(() => {
        return { error: null, value: "ok" };
      })
      .catch((r: BackblazeAxiosResponse) => {
        return { error: r.response.data.message, value: null };
      });

    return this.storage
      .deleteFileVersion({
        fileId: file.id,
        fileName: file.name,
      })
      .then(() => {
        return { error: null, value: "ok" };
      })
      .catch((r: BackblazeAxiosResponse) => {
        return { error: r.response.data.message, value: null };
      });
  }

  public async createBucket(
    name: string,
    options: BackblazeBucketOptions = { bucketType: "allPrivate" }
  ): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const msg = validateName(name);
    if (msg !== null) {
      return { error: msg, value: null };
    }

    return this.storage
      .createBucket({
        ...options,
        bucketName: name,
        bucketType: options.bucketType,
      })
      .then((response: { data: { bucketType: string } }) => {
        const {
          data: { bucketType },
        } = response;
        return { error: null, value: "ok" };
      })
      .catch((r: BackblazeAxiosResponse) => {
        return { error: r.response.data.message, value: null };
      });
  }

  public async clearBucket(name: string): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const data = await this.getFiles(name);
    if (data.error !== null) {
      return { error: data.error, value: null };
    }

    const { value: files } = data;
    return Promise.all(
      files.map((file: FileB2) =>
        this.storage.deleteFileVersion({
          fileId: file.id,
          fileName: file.name,
        })
      )
    )
      .then((what) => {
        console.log(what);
        return { error: null, value: "ok" };
      })
      .catch((r: BackblazeAxiosResponse) => {
        return { error: r.response.data.message, value: null };
      });
  }

  public async deleteBucket(name: string): Promise<ResultObject> {
    const data = await this.clearBucket(name);
    if (data.error !== null) {
      return { error: data.error, value: null };
    }

    const { error, value: bucket } = await this.getBucket(name);
    if (error !== null) {
      return { error: error, value: null };
    }

    return this.storage
      .deleteBucket({ bucketId: bucket.id })
      .then(() => {
        return { error: null, value: "ok" };
      })
      .catch((r: BackblazeAxiosResponse) => {
        return { error: r.response.data.message, value: null };
      });
  }

  public async listBuckets(): Promise<ResultObjectBuckets> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const data = await this.getBuckets();
    if (data.error === null) {
      const { value: buckets } = data;
      return {
        error: null,
        value: buckets.map((b) => {
          return b.name;
        }),
      };
    } else {
      return { error: data.error, value: null };
    }
  }

  public async listFiles(bucketName: string, numFiles: number = 1000): Promise<ResultObjectFiles> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const data = await this.getFiles(bucketName);
    if (data.error === null) {
      const { value: files } = data;
      return {
        error: null,
        value: files.map((f) => {
          return [f.name, f.contentLength];
        }),
      };
    } else {
      return { error: data.error, value: null };
    }
  }

  public async sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const data = await this.getFile(bucketName, fileName);
    if (data.error === null) {
      const { value: file } = data;
      return { error: null, value: file.contentLength };
    } else {
      return { error: data.error, value: null };
    }
  }

  async bucketExists(bucketName: string): Promise<ResultObjectBoolean> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const data = await this.getBucket(bucketName);
    if (data.error === null) {
      return { error: null, value: true };
    } else {
      return { error: data.error, value: null };
    }
  }

  async fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    const { error, value } = await this.sizeOf(bucketName, fileName);
    if (error === null) {
      return { error: null, value: true };
    } else {
      return { error: null, value: false };
    }
  }

  // probably not necessary; may be a little bit more lightweight compared to listFileVersions
  // if you don't have file versions
  public async listFileNames(bucketName: string): Promise<ResultObjectBuckets> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const data = await this.getBucket(bucketName);
    if (data.error !== null) {
      return { error: data.error, value: null };
    }

    const { value: bucket } = data;
    return this.storage
      .listFileNames({ bucketId: bucket.id })
      .then(({ data: { files } }) => {
        // console.log(files);
        return {
          error: null,
          value: files.map(({ fileName }) => {
            return fileName;
          }),
        };
      })
      .catch((r: BackblazeAxiosResponse) => {
        return {
          error: r.response.data.message,
          value: null,
        };
      });
  }
}
