import B2 from "backblaze-b2";
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
import {
  StorageType,
  ConfigBackblazeB2,
  BackblazeB2Bucket,
  BackblazeB2File,
  IStorage,
  ResultObjectBoolean,
  ResultObject,
  ResultObjectReadable,
  ResultObjectBucketsB2,
  ResultObjectFilesB2,
  BucketB2,
  ResultObjectBucketB2,
  ResultObjectFileB2,
  FileB2,
  FileBuffer,
  FileStream,
  FilePath,
  ResultObjectBuckets,
  ResultObjectFiles,
} from "./types";
import { parseUrl, validateName } from "./util";

require("@gideo-llc/backblaze-b2-upload-any").install(B2);

export class AdapterBackblazeB2 extends AbstractAdapter {
  protected type = StorageType.B2;
  private bucketId: string;
  private storage: B2;
  private buckets: BackblazeB2Bucket[] = [];
  private files: BackblazeB2File[] = [];
  private authorized: boolean = false;

  constructor(config: string | ConfigBackblazeB2) {
    super();
    this.config = this.parseConfig(config);
    this.storage = new B2(this.config);
  }

  private parseConfig(config: string | ConfigBackblazeB2): ConfigBackblazeB2 {
    let cfg: ConfigBackblazeB2;
    if (typeof config === "string") {
      const {
        type,
        part1: applicationKeyId,
        part2: applicationKey,
        bucketName,
        queryString,
      } = parseUrl(config);
      cfg = {
        type,
        applicationKeyId,
        applicationKey,
        bucketName,
        ...queryString,
      };
    } else {
      cfg = { ...config };
    }

    if (cfg.skipCheck === true) {
      return cfg;
    }

    if (!cfg.applicationKey || !cfg.applicationKeyId) {
      throw new Error(
        "You must specify a value for both 'applicationKeyId' and  'applicationKey' for storage type 'b2'"
      );
    }
    return cfg;
  }

  private async authorize(): Promise<ResultObject> {
    if (this.authorized) {
      return Promise.resolve({ value: "ok", error: null });
    }

    return this.storage
      .authorize()
      .then(() => {
        this.authorized = true;
        return { value: "ok", error: null };
      })
      .catch((e: Error) => {
        return { value: null, error: e.message };
      });
  }

  private async getBuckets(): Promise<ResultObjectBucketsB2> {
    return this.storage
      .listBuckets()
      .then(({ data: { buckets } }) => {
        const value = buckets.map(({ bucketId, bucketName }) => {
          return {
            bucketId,
            bucketName,
          };
        });
        return { value, error: null };
      })
      .catch((e: Error) => {
        return { value: null, error: e.message };
      });
  }

  private async getBucket(name: string): Promise<ResultObjectBucketB2> {
    const { value: buckets, error } = await this.getBuckets();
    if (error !== null) {
      return Promise.resolve({ value: null, error });
    }

    for (let i = 0; i < buckets.length; i++) {
      const bucket = buckets[i];
      if (bucket.name === name) {
        return Promise.resolve({ value: bucket, error: null });
      }
    }
    return Promise.resolve({ value: null, error: `could not find bucket ${name}` });
  }

  private async getFiles(bucketName: string): Promise<ResultObjectFilesB2> {
    const { value: bucket, error } = await this.getBucket(bucketName);
    if (error !== null) {
      return Promise.resolve({ error, value: null });
    }

    return this.storage
      .listFileVersions({
        bucketId: bucket.id,
      })
      .then(({ data: { files } }) => {
        const value = files.map(({ fileId, fileName, contentType, contentLength }) => {
          return {
            fileId,
            fileName,
            contentType,
            contentLength,
          };
        });
        return { value, error: null };
      })
      .catch((e: Error) => {
        return { value: null, error: e.message };
      });
  }

  private async getFile(bucketName: string, name: string): Promise<ResultObjectFileB2> {
    const { value: files, error } = await this.getFiles(bucketName);
    if (error !== null) {
      return Promise.resolve({ error, value: null });
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name === name) {
        return Promise.resolve({ value: file, error: null });
      }
    }
    return Promise.resolve({ value: null, error: `could not find file ${name}` });
  }

  public async getFileAsReadable(
    bucketName: string,
    fileName: string,
    options: { start?: number; end?: number } = { start: 0 }
  ): Promise<ResultObjectReadable> {
    const { error } = await this.authorize();
    if (error !== null) {
      return Promise.resolve({ error, value: null });
    }

    const data = await this.getFile(bucketName, fileName);
    if (data.error !== null) {
      return Promise.resolve({ error: data.error, value: null });
    }
    const { value: file } = data;
    const d = await this.storage.downloadFileById({
      fileId: file.id,
      responseType: "stream",
      axios: {
        headers: {
          "Content-Type": file.contentType,
          Range: `bytes=${options.start}-${options.end || ""}`,
        },
      },
    });
    return d.data;
  }

  public async getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return Promise.resolve({ error, value: null });
    }

    return Promise.resolve({ value: "ok", error: null });
  }

  public async removeFile(bucketName: string, fileName: string): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return Promise.resolve({ error, value: null });
    }

    const data = await this.getFiles(bucketName);
    if (error !== null) {
      return Promise.resolve({ error, value: null });
    }
    const { value: files } = data;

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
      .catch((e: Error) => {
        return { error: e.message, value: null };
      });
  }

  // util members

  protected async store(params: FilePath): Promise<ResultObject>;
  protected async store(params: FileBuffer): Promise<ResultObject>;
  protected async store(params: FileStream): Promise<ResultObject>;
  protected async store(params: FilePath | FileBuffer | FileStream): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return Promise.resolve({ error, value: null });
    }

    const { bucketName, targetPath } = params;

    let { options } = params;
    if (typeof options === "undefined") {
      options = {};
    }

    let data: string | Buffer | Readable;
    if (typeof (params as FilePath).origPath !== "undefined") {
      data = (params as FilePath).origPath;
    } else if (typeof (params as FileBuffer).buffer !== "undefined") {
      data = (params as FileBuffer).buffer;
    } else if (typeof (params as FileStream).stream !== "undefined") {
      data = (params as FileStream).stream;
    }

    return this.storage
      .uploadAny({
        ...options,
        bucketId: this.bucketId,
        fileName: targetPath,
        data,
      })
      .then((file: BackblazeB2File) => {
        console.log(file);
        return {
          error: null,
          value: `${this.storage.downloadUrl}/file/${bucketName}/${targetPath}`,
        };
      })
      .catch((e: Error) => {
        return { error: e.message, value: null };
      });
  }

  async createBucket(name: string, options: object = {}): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return Promise.resolve({ error, value: null });
    }

    const msg = validateName(name);
    if (msg !== null) {
      return Promise.reject({ error: msg, value: null });
    }

    return this.storage
      .createBucket({
        ...options,
        bucketName: name,
        bucketType: "allPrivate", // should be a config option!
      })
      .then((what) => {
        console.log(what);
        return Promise.reject({ error: null, value: "ok" });
      })
      .catch((e: Error) => {
        return Promise.reject({ error: e.message, value: null });
      });
  }

  async clearBucket(name: string): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return Promise.resolve({ error, value: null });
    }

    const data = await this.getFiles(name);
    if (data.error !== null) {
      return Promise.resolve({ error: data.error, value: null });
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
      .catch((e: Error) => {
        return { error: e.message, value: null };
      });
  }

  async deleteBucket(name: string): Promise<ResultObject> {
    const data = await this.clearBucket(name);
    if (data.error !== null) {
      return Promise.resolve({ error: data.error, value: null });
    }

    const { error, value: bucket } = await this.getBucket(name);
    if (error !== null) {
      return Promise.resolve({ error: error, value: null });
    }

    return this.storage
      .deleteBucket({ bucketId: bucket.id })
      .then(() => {
        return { error: null, value: "ok" };
      })
      .catch((e: Error) => {
        return { error: e.message, value: null };
      });
  }

  async listBuckets(): Promise<ResultObjectBuckets> {
    const { error } = await this.authorize();
    if (error !== null) {
      return Promise.resolve({ error, value: null });
    }

    return this.getBuckets()
      .then(({ value: buckets }) => {
        return {
          error: null,
          value: buckets.map((b) => {
            return b.name;
          }),
        };
      })
      .catch((e: Error) => {
        return { error: e.message, value: null };
      });
  }

  async listFiles(bucketName: string, numFiles: number = 1000): Promise<ResultObjectFiles> {
    const { error } = await this.authorize();
    if (error !== null) {
      return Promise.resolve({ error, value: null });
    }

    return this.getFiles(bucketName)
      .then(({ value: files }) => {
        const f: Array<[string, number]> = files.map((f) => {
          return [f.name, f.contentLength];
        });
        return {
          error: null,
          value: f,
        };
      })
      .catch((e: Error) => {
        return { error: e.message, value: null };
      });
  }

  private async findFile(name: string): Promise<BackblazeB2File | null> {
    let i = this.files.findIndex((file: BackblazeB2File) => file?.fileName === name);
    if (i > -1) {
      return this.files[i];
    }
    const {
      data: { files },
    } = await this.storage.listFileNames({ bucketId: this.bucketId });
    this.files = files;
    i = this.files.findIndex((file: BackblazeB2File) => file.fileName === name);
    if (i > -1) {
      return this.files[i];
    }
    return null;
  }

  async sizeOf(name: string): Promise<number> {
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }
    const file = await this.findFile(name);
    if (file === null) {
      throw new Error("File not found");
    }
    return file.contentLength;
  }

  async fileExists(name: string): Promise<boolean> {
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }
    const file = await this.findFile(name);
    if (file === null) {
      return false;
    }
    return true;
  }
}
