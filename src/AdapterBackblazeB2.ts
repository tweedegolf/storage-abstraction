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
} from "./types";
import { parseUrl } from "./util";

require("@gideo-llc/backblaze-b2-upload-any").install(B2);

export class AdapterBackblazeB2 extends AbstractAdapter {
  protected type = StorageType.B2;
  private bucketId: string;
  private storage: B2;
  private buckets: BackblazeB2Bucket[] = [];
  private files: BackblazeB2File[] = [];
  private initialized: boolean = false;

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

  private async init(): Promise<ResultObject> {
    if (this.initialized) {
      return Promise.resolve({ value: "ok", error: null });
    }
    try {
      await this.storage.authorize();
      this.initialized = true;
      return Promise.resolve({ value: "ok", error: null });
    } catch (e) {
      return Promise.resolve({ value: null, error: e.message });
    }
  }

  private async getBucketId(name: string) {
    const { error } = await this.init();
    if (error !== null) {
      return Promise.resolve({ error, value: null });
    }
    const {
      data: { buckets },
    } = await this.storage.listBuckets();

    let id = null;
    for (let i = 0; i < buckets.length; i++) {
      const { bucketId, bucketName } = buckets[i];
      if (bucketName === name) {
        id = bucketId;
        return Promise.resolve({ value: bucketId, error: null });
      }
    }
    return Promise.resolve({ value: null, error: `could not find bucket ${name}` });
  }

  public async getFileAsReadable(
    bucketName: string,
    fileName: string,
    options: { start?: number; end?: number } = { start: 0 }
  ): Promise<Readable> {
    const file = await this.findFile(name);
    if (file === null) {
      throw new Error("file not found");
    }
    const d = await this.storage.downloadFileById({
      fileId: file.fileId,
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

  async removeFile(bucketName: string, fileName: string): Promise<ResultObject> {
    const {
      data: { files },
    } = await this.storage.listFileVersions({
      bucketId: this.bucketId,
    });

    Promise.all(
      files
        .filter((f: BackblazeB2File) => f.fileName === name)
        .map(({ fileId, fileName }) =>
          this.storage.deleteFileVersion({
            fileId,
            fileName,
          })
        )
    );
    this.files = this.files.filter((file) => file.fileName !== name);
    return "file removed";
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
