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
} from "./types";
import { parseUrl } from "./util";

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
    try {
      await this.storage.authorize();
      this.authorized = true;
      return Promise.resolve({ value: "ok", error: null });
    } catch (e) {
      return Promise.resolve({ value: null, error: e.message });
    }
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
        return Promise.resolve({ value, error: null });
      })
      .catch((e: Error) => {
        return Promise.resolve({ value: null, error: e.message });
      });
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
        return Promise.resolve({ value, error: null });
      })
      .catch((e: Error) => {
        return Promise.resolve({ value: null, error: e.message });
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
        return Promise.resolve({ error: null, value: "ok" });
      })
      .catch((e: Error) => {
        return Promise.resolve({ error: e.message, value: null });
      });
  }

  // util function for findBucket
  private findBucketLocal(name: string): BackblazeB2Bucket | null {
    if (this.buckets.length === 0) {
      return null;
    }
    const index = this.buckets.findIndex((b) => b.bucketName === name);
    if (index !== -1) {
      return this.buckets[index];
    }
    return null;
  }

  // check if we have accessed and stored the bucket earlier
  private async findBucket(name: string): Promise<BackblazeB2Bucket | null> {
    const b = this.findBucketLocal(name);
    if (b !== null) {
      return b;
    }
    await this.listBuckets();
    return this.findBucketLocal(name);
  }

  // util members

  protected async store(buffer: Buffer, targetPath: string, options: object): Promise<string>;
  protected async store(stream: Readable, targetPath: string, options: object): Promise<string>;
  protected async store(origPath: string, targetPath: string, options: object): Promise<string>;
  protected async store(
    arg: string | Buffer | Readable,
    targetPath: string,
    options: object
  ): Promise<string> {
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }
    await this.createBucket(this.bucketName);
    return await this.storage
      .uploadAny({
        ...options,
        bucketId: this.bucketId,
        fileName: targetPath,
        data: arg,
      })
      .then((file: BackblazeB2File) => {
        this.files.push(file);
        // console.log("FILE", file);
        return `${this.storage.downloadUrl}/file/${this.bucketName}/${targetPath}`;
      })
      .catch((err: Error) => {
        // console.log("ERROR", err);
        return Promise.reject(err);
      });
  }

  async createBucket(name: string, options: object = {}): Promise<string> {
    const msg = this.validateName(name);
    if (msg !== null) {
      return Promise.reject(msg);
    }

    const b = await this.findBucket(name);
    if (b !== null) {
      return;
    }

    const d = await this.storage
      .createBucket({
        ...options,
        bucketName: name,
        bucketType: "allPrivate", // should be a config option!
      })
      .catch((e) => {
        throw new Error(e.response.data.message);
      });

    this.buckets.push(d.data);
    // console.log("createBucket", this.buckets, d.data);
    return "bucket created";
  }

  async clearBucket(name?: string): Promise<string> {
    const n = name || this.bucketName;

    const b = await this.findBucket(n);
    if (b === null) {
      throw new Error("bucket not found");
    }

    const {
      data: { files },
    } = await this.storage.listFileVersions({
      bucketId: b.bucketId,
    });

    await Promise.all(
      files.map((file: BackblazeB2File) =>
        this.storage.deleteFileVersion({
          fileId: file.fileId,
          fileName: file.fileName,
        })
      )
    );

    return "bucket cleared";
  }

  async deleteBucket(name?: string): Promise<string> {
    const n = name || this.bucketName;

    const b = await this.findBucket(n);
    if (b === null) {
      throw new Error("bucket not found");
    }

    try {
      await this.clearBucket(n);
    } catch (e) {
      return e.response.data.message;
    }

    const { bucketId } = b;
    try {
      await this.storage.deleteBucket({ bucketId });
    } catch (e) {
      return e.response.data.message;
    }
    this.buckets = this.buckets.filter((b) => b.bucketName !== n);
    if (n === this.bucketName) {
      this.bucketId = "";
      this.bucketName = "";
    }
    return "bucket deleted";
  }

  async listBuckets(): Promise<string[]> {
    const {
      data: { buckets },
    } = await this.storage.listBuckets();
    // this.bucketsById = buckets.reduce((acc: { [id: string]: string }, val: BackBlazeB2Bucket) => {
    //   acc[val.bucketId] = val.bucketName;
    //   return acc;
    // }, {});
    this.buckets = buckets;
    const names = this.buckets.map((b) => b.bucketName);
    return names;
  }

  async listFiles(numFiles: number = 1000): Promise<[string, number][]> {
    // console.log("ID", this.bucketId);
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }

    const {
      data: { files, nextFileName },
    } = await this.storage.listFileNames({
      bucketId: this.bucketId,
      maxFileCount: numFiles,
    });
    // console.log(files);
    this.files = [...files];

    // @TODO; should loop this until all files are listed
    if (nextFileName !== null) {
      // console.log(nextFileName);
      this.nextFileName = nextFileName;
    }
    return this.files.map((f) => [f.fileName, f.contentLength]);
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
