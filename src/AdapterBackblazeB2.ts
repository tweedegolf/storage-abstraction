import B2 from "backblaze-b2";
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
import {
  StorageType,
  ConfigBackblazeB2,
  BackblazeB2File,
  ResultObjectBoolean,
  ResultObject,
  ResultObjectReadable,
  ResultObjectBucketsB2,
  ResultObjectFilesB2,
  ResultObjectBucketB2,
  ResultObjectFileB2,
  FileB2,
  FileBuffer,
  FileStream,
  FilePath,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
} from "./types";
import { parseUrl, validateName } from "./util";

require("@gideo-llc/backblaze-b2-upload-any").install(B2);

export class AdapterBackblazeB2 extends AbstractAdapter {
  protected type = StorageType.B2;
  private storage: B2;
  private authorized: boolean = false;
  private configError: string | null = null;

  constructor(config: string | ConfigBackblazeB2) {
    super();
    this.configuration = this.parseConfig(config);
    this.storage = new B2(this.configuration);
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
      this.configError =
        "You must specify a value for both 'applicationKeyId' and 'applicationKey' for storage type 'b2'";
    }
    return cfg;
  }

  private async authorize(): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }
    if (this.authorized) {
      return { value: "ok", error: null };
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
            id: bucketId,
            name: bucketName,
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
      return { value: null, error };
    }

    for (let i = 0; i < buckets.length; i++) {
      const bucket = buckets[i];
      if (bucket.name === name) {
        return { value: bucket, error: null };
      }
    }
    return { value: null, error: `could not find bucket ${name}` };
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
      .catch((e: Error) => {
        return { value: null, error: e.message };
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
    return { value: null, error: `could not find file ${name}` };
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
      .catch((e: Error) => {
        return {
          error: e.message,
          value: null,
        };
      });
  }

  public async getFileAsReadable(
    bucketName: string,
    fileName: string,
    options: { start?: number; end?: number } = { start: 0 }
  ): Promise<ResultObjectReadable> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const data = await this.getFile(bucketName, fileName);
    if (data.error !== null) {
      return { error: data.error, value: null };
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
      return { error, value: null };
    }

    // return Promise.resolve({ value: "ok", error: null });
    return { value: "ok", error: null };
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
    if (typeof (params as FilePath).origPath !== "undefined") {
      fileData = (params as FilePath).origPath;
    } else if (typeof (params as FileBuffer).buffer !== "undefined") {
      fileData = (params as FileBuffer).buffer;
    } else if (typeof (params as FileStream).stream !== "undefined") {
      fileData = (params as FileStream).stream;
    }

    return this.storage
      .uploadAny({
        ...options,
        bucketId: bucket.id,
        fileName: targetPath,
        data: fileData,
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

  public async createBucket(name: string, options: object = {}): Promise<ResultObject> {
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
        bucketType: "allPrivate", // should be a config option!
      })
      .then((what) => {
        console.log(what);
        return { error: null, value: "ok" };
      })
      .catch((e: Error) => {
        return { error: e.message, value: null };
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
      .catch((e: Error) => {
        return { error: e.message, value: null };
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
      .catch((e: Error) => {
        return { error: e.message, value: null };
      });
  }

  public async listBuckets(): Promise<ResultObjectBuckets> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
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

  public async listFiles(bucketName: string, numFiles: number = 1000): Promise<ResultObjectFiles> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
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

  public async sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    return this.getFile(bucketName, fileName)
      .then(({ value: file }) => {
        return { error: null, value: file.contentLength };
      })
      .catch((e: Error) => {
        return { error: e.message, value: null };
      });
  }

  async bucketExists(bucketName: string): Promise<ResultObjectBoolean> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    return this.getBucket(bucketName)
      .then(() => {
        return { error: null, value: true };
      })
      .catch(() => {
        return { error: null, value: false };
      });
  }

  async fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    return this.sizeOf(bucketName, fileName)
      .then(() => {
        return { error: null, value: true };
      })
      .catch(() => {
        return { error: null, value: false };
      });
  }
}
