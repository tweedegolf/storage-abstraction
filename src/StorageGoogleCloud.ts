import fs from "fs";
import path from "path";
import { zip } from "ramda";
import to from "await-to-js";
import { Readable } from "stream";
import {
  Storage as GoogleCloudStorage,
  File,
  CreateReadStreamOptions
} from "@google-cloud/storage";
import { AbstractStorage } from "./AbstractStorage";
import { IStorage, ConfigGoogleCloud } from "./types";
import slugify from "slugify";

export class StorageGoogleCloud extends AbstractStorage implements IStorage {
  private storage: GoogleCloudStorage;
  protected bucketName: string;

  constructor(config: string) {
    super(config);
    if (!config) {
      throw new Error("please provide a keyFilename");
    }

    // const o = JSON.parse(config);
    // console.log(o);

    this.storage = new GoogleCloudStorage({
      // projectId: "default-demo-app-35b34",
      keyFilename: config
    });
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
      throw new Error(
        `File ${fileName} could not be retrieved from bucket ${this.bucketName}`
      );
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
    throw new Error(
      `File ${fileName} could not be retrieved from bucket ${this.bucketName}`
    );
  }

  // not in use
  async downloadFile(fileName: string, downloadPath: string): Promise<void> {
    const file = await this.storage.bucket(this.bucketName).file(fileName);
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
  protected async store(origPath: string, targetPath: string): Promise<void>;
  protected async store(
    arg: string | Buffer,
    targetPath: string
  ): Promise<void> {
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
      readStream._read = () => {}; // _read is required but you can noop it
      readStream.push(arg);
      readStream.push(null);
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
    if (name === null) {
      throw new Error("Can not use `null` as bucket name");
    }
    const n = slugify(name);
    if (super.checkBucket(n)) {
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
    n = slugify(n);
    await this.storage.bucket(n).deleteFiles({ force: true });
  }

  async deleteBucket(name?: string): Promise<void> {
    let n = name || this.bucketName;
    n = slugify(n);
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

  private async getMetaData(files: string[]) {
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
}
