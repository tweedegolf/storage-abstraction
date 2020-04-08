import fs from "fs";
import path from "path";
import { zip } from "ramda";
import to from "await-to-js";
import { Readable } from "stream";
import {
  Storage as GoogleCloudStorage,
  File,
  CreateReadStreamOptions,
} from "@google-cloud/storage";
import { AbstractStorage } from "./AbstractStorage";
import { ConfigGoogleCloud, StorageType } from "./types";
import { parseUrl } from "./util";

export class StorageGoogleCloud extends AbstractStorage {
  protected type = StorageType.GCS;
  // protected bucketName: string;
  private buckets: string[] = [];
  private storage: GoogleCloudStorage;
  public static defaultOptions = {
    slug: true,
  };

  constructor(config: string | ConfigGoogleCloud) {
    super();
    const { keyFilename, projectId, bucketName, options } = this.parseConfig(config);
    this.storage = new GoogleCloudStorage({ keyFilename, projectId });
    this.bucketName = bucketName;
    this.options = { ...StorageGoogleCloud.defaultOptions, ...options };
    this.config = {
      type: this.type,
      keyFilename,
      projectId,
      bucketName,
      options,
    };
  }

  private getGCSProjectId(config: string): string {
    const data = fs.readFileSync(config).toString("utf-8");
    const json = JSON.parse(data);
    return json.project_id;
  }

  private parseConfig(config: string | ConfigGoogleCloud): ConfigGoogleCloud {
    let cfg: ConfigGoogleCloud;
    if (typeof config === "string") {
      const [type, keyFilename, projectId, bucketName, options] = parseUrl(config);
      cfg = {
        type,
        keyFilename,
        projectId,
        bucketName,
        options,
      };
    } else {
      cfg = config;
    }
    if (!cfg.keyFilename) {
      throw new Error("You must specify a value for 'keyFilename' for storage type 'gcs'");
    }
    if (!cfg.projectId) {
      cfg.projectId = this.getGCSProjectId(cfg.keyFilename);
    }
    return cfg;
  }

  async init(): Promise<boolean> {
    // no further initialization required
    this.initialized = true;
    return Promise.resolve(true);
  }

  // After uploading a file to Google Storage it may take a while before the file
  // can be discovered and downloaded; this function adds a little delay
  async getFile(fileName: string, retries: number = 5): Promise<File> {
    const file = this.storage.bucket(this.bucketName).file(fileName);
    const [exists] = await file.exists();
    if (!exists && retries !== 0) {
      const r = retries - 1;
      await new Promise(res => {
        setTimeout(res, 250);
      });
      // console.log('RETRY', r, fileName);
      return this.getFile(fileName, r);
    }
    if (!exists) {
      throw new Error(`File ${fileName} could not be retrieved from bucket ${this.bucketName}`);
    }
    return file;
  }

  async getFileAsReadable(
    fileName: string,
    options: CreateReadStreamOptions = { start: 0 }
  ): Promise<Readable> {
    const file = this.storage.bucket(this.bucketName).file(fileName);
    const [exists] = await file.exists();
    if (exists) {
      return file.createReadStream(options);
    }
    throw new Error(`File ${fileName} could not be retrieved from bucket ${this.bucketName}`);
  }

  // not in use
  async downloadFile(fileName: string, downloadPath: string): Promise<void> {
    const file = this.storage.bucket(this.bucketName).file(fileName);
    const localFilename = path.join(downloadPath, fileName);
    await file.download({ destination: localFilename });
  }

  async removeFile(fileName: string): Promise<void> {
    try {
      await this.storage
        .bucket(this.bucketName)
        .file(fileName)
        .delete();
    } catch (e) {
      if (e.message.indexOf("No such object") !== -1) {
        return;
      }
      // console.log(e.message);
      throw e;
    }
  }

  // util members

  protected async store(buffer: Buffer, targetPath: string): Promise<void>;
  protected async store(stream: Readable, targetPath: string): Promise<void>;
  protected async store(origPath: string, targetPath: string): Promise<void>;
  protected async store(arg: string | Buffer | Readable, targetPath: string): Promise<void> {
    if (this.bucketName === null) {
      throw new Error("Please select a bucket first");
    }
    await this.createBucket(this.bucketName);

    let readStream: Readable;
    if (typeof arg === "string") {
      await fs.promises.stat(arg); // throws error if path doesn't exist
      readStream = fs.createReadStream(arg);
    } else if (arg instanceof Buffer) {
      readStream = new Readable();
      readStream._read = (): void => {}; // _read is required but you can noop it
      readStream.push(arg);
      readStream.push(null);
    } else if (arg instanceof Readable) {
      readStream = arg;
    }
    const writeStream = this.storage
      .bucket(this.bucketName)
      .file(targetPath)
      .createWriteStream();
    return new Promise((resolve, reject) => {
      readStream
        .pipe(writeStream)
        .on("error", reject)
        .on("finish", resolve);
      writeStream.on("error", reject);
    });
  }

  async createBucket(name: string): Promise<void> {
    super.createBucket(name);
    const n = super.generateSlug(name);
    if (this.buckets.findIndex(b => b === n) !== -1) {
      return;
    }
    const bucket = this.storage.bucket(n);
    const [exists] = await bucket.exists();
    if (exists) {
      return;
    }

    try {
      await this.storage.createBucket(n);
      this.buckets.push(n);
    } catch (e) {
      if (e.code === 409) {
        // error code 409 is 'You already own this bucket. Please select another name.'
        // so we can safely return true if this error occurs
        return;
      }
      throw new Error(e.message);
    }
  }

  async selectBucket(name: string | null): Promise<void> {
    if (name === null) {
      this.bucketName = null;
      return;
    }

    const [error] = await to(this.createBucket(name));
    if (error !== null) {
      throw error;
    }
    this.bucketName = name;
  }

  async clearBucket(name?: string): Promise<void> {
    let n = name || this.bucketName;
    n = super.generateSlug(n);
    await this.storage.bucket(n).deleteFiles({ force: true });
  }

  async deleteBucket(name?: string): Promise<void> {
    let n = name || this.bucketName;
    n = super.generateSlug(n);
    await this.clearBucket(n);
    const data = await this.storage.bucket(n).delete();
    // console.log(data);
    if (n === this.bucketName) {
      this.bucketName = null;
    }
    this.buckets = this.buckets.filter(b => b !== n);
  }

  async listBuckets(): Promise<string[]> {
    const [buckets] = await this.storage.getBuckets();
    this.buckets = buckets.map(b => b.metadata.id);
    return this.buckets;
  }

  private async getMetaData(files: string[]): Promise<number[]> {
    const sizes: number[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = this.storage.bucket(this.bucketName).file(files[i]);
      const [metadata] = await file.getMetadata();
      // console.log(metadata);
      sizes.push(parseInt(metadata.size, 10));
    }
    return sizes;
  }

  async listFiles(numFiles: number = 1000): Promise<[string, number][]> {
    if (this.bucketName === null) {
      throw new Error("Please select a bucket first");
    }
    const data = await this.storage.bucket(this.bucketName).getFiles();
    const names = data[0].map(f => f.name);
    const sizes = await this.getMetaData(names);
    return zip(names, sizes) as [string, number][];
  }

  async sizeOf(name: string): Promise<number> {
    if (this.bucketName === null) {
      throw new Error("Please select a bucket first");
    }
    const file = this.storage.bucket(this.bucketName).file(name);
    const [metadata] = await file.getMetadata();
    return parseInt(metadata.size, 10);
  }

  async fileExists(name: string): Promise<boolean> {
    return true;
  }
}
