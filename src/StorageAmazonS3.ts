import fs from "fs";
import slugify from "slugify";
import { Readable } from "stream";
import S3 from "aws-sdk/clients/s3";
import { AbstractStorage } from "./AbstractStorage";
import { ConfigAmazonS3, IStorage, StorageConfig, StorageType, JSON as TypeJSON } from "./types";
import { parseUrl } from "./util";

export class StorageAmazonS3 extends AbstractStorage {
  protected type = StorageType.S3;
  // protected bucketName: string;
  private storage: S3;
  private buckets: string[] = [];

  constructor(config: string | ConfigAmazonS3) {
    super();
    const { accessKeyId, secretAccessKey, bucketName, options } = this.parseConfig(config);
    this.storage = new S3({ accessKeyId, secretAccessKey });
    this.bucketName = bucketName;
    this.options = options;
  }

  async init(): Promise<boolean> {
    // no further initialization required
    this.initialized = true;
    return Promise.resolve(true);
  }

  private parseConfig(config: string | ConfigAmazonS3): ConfigAmazonS3 {
    let cfg: ConfigAmazonS3;
    if (typeof config === "string") {
      const [type, accessKeyId, secretAccessKey, bucketName, options] = parseUrl(config);
      cfg = {
        type,
        accessKeyId,
        secretAccessKey,
        bucketName,
        options,
      };
    } else {
      cfg = config;
    }

    if (!cfg.accessKeyId || !cfg.secretAccessKey) {
      throw new Error(
        "You must specify a value for both 'applicationKeyId' and  'applicationKey' for storage type 's3'"
      );
    }

    return cfg;
  }

  async getFileAsReadable(
    fileName: string,
    options: { start?: number; end?: number } = { start: 0 }
  ): Promise<Readable> {
    const params = {
      Bucket: this.bucketName,
      Key: fileName,
      Range: `bytes=${options.start}-${options.end}`,
    };
    // console.log(`bytes=${options.start}-${options.end}`);
    await this.storage.headObject(params).promise();
    return this.storage.getObject(params).createReadStream();
  }

  async removeFile(fileName: string): Promise<void> {
    const params = {
      Bucket: this.bucketName,
      Key: fileName,
    };
    await this.storage.deleteObject(params).promise();
  }

  // util members

  async createBucket(name: string): Promise<void> {
    if (name === null) {
      throw new Error("Can not use `null` as bucket name");
    }
    const n = slugify(name);
    // console.log('createBucket', n);
    if (this.checkBucket(n)) {
      // console.log('CHECK BUCKET', n);
      return;
    }
    try {
      const data = await this.storage.headBucket({ Bucket: n }).promise();
      // console.log('HEAD BUCKET', n, data);
      this.buckets.push(n);
    } catch (e) {
      if (e.code === "Forbidden") {
        // BucketAlreadyExists: The requested bucket name is not available.
        // The bucket namespace is shared by all users of the system.
        // Please select a different name and try again.
        throw e;
      }
      const data = await this.storage.createBucket({ Bucket: n }).promise();
      // console.log('CREATE BUCKET', n, data);
      this.buckets.push(n);
    }
  }

  async selectBucket(name: string | null): Promise<void> {
    if (name === null) {
      this.bucketName = null;
      return;
    }
    await this.createBucket(name);
    this.bucketName = name;
  }

  async clearBucket(name?: string): Promise<void> {
    let n = name || this.bucketName;
    n = slugify(n);
    // console.log('clearBucket', n);
    const params1 = {
      Bucket: n,
      MaxKeys: 1000,
    };
    const { Contents: content } = await this.storage.listObjects(params1).promise();
    if (content.length === 0) {
      return;
    }

    const params2 = {
      Bucket: n,
      Delete: {
        Objects: content.map(value => ({ Key: value.Key })),
        Quiet: false,
      },
    };
    await this.storage.deleteObjects(params2).promise();
  }

  async deleteBucket(name?: string): Promise<void> {
    let n = name || this.bucketName;
    n = slugify(n);
    // try {
    //   const data = await this.storage.listObjectVersions({ Bucket: n }).promise();
    //   console.log(data);
    //   return true;
    // } catch (e) {
    //   throw e;
    // }
    // console.log('deleteBucket', n);
    try {
      await this.clearBucket(name);
      const result = await this.storage
        .deleteBucket({
          Bucket: n,
        })
        .promise();
      if (n === this.bucketName) {
        this.bucketName = null;
      }
      this.buckets = this.buckets.filter(b => b !== n);
      // console.log(this.buckets, result);
    } catch (e) {
      if (e.code === "NoSuchBucket") {
        return;
      }
      throw e;
    }
  }

  async listBuckets(): Promise<string[]> {
    const data = await this.storage.listBuckets().promise();
    this.buckets = data.Buckets.map(d => d.Name);
    return this.buckets;
  }

  protected async store(buffer: Buffer, targetPath: string): Promise<void>;
  protected async store(stream: Readable, targetPath: string): Promise<void>;
  protected async store(origPath: string, targetPath: string): Promise<void>;
  protected async store(arg: string | Buffer | Readable, targetPath: string): Promise<void> {
    if (this.bucketName === null) {
      throw new Error("Please select a bucket first");
    }
    await this.createBucket(this.bucketName);
    let readable: Readable;
    if (typeof arg === "string") {
      readable = fs.createReadStream(arg);
    } else if (arg instanceof Buffer) {
      readable = new Readable();
      readable._read = (): void => {}; // _read is required but you can noop it
      readable.push(arg);
      readable.push(null);
    } else if (arg instanceof Readable) {
      readable = arg;
    }
    const params = {
      Bucket: this.bucketName,
      Key: targetPath,
      Body: readable,
    };
    await this.storage.upload(params).promise();
  }

  async listFiles(maxFiles: number = 1000): Promise<[string, number][]> {
    if (this.bucketName === null) {
      throw new Error("Please select a bucket first");
    }
    const params = {
      Bucket: this.bucketName,
      MaxKeys: maxFiles,
    };
    const { Contents: content } = await this.storage.listObjects(params).promise();
    return content.map(o => [o.Key, o.Size]) as [string, number][];
  }

  async sizeOf(name: string): Promise<number> {
    if (this.bucketName === null) {
      throw new Error("Please select a bucket first");
    }
    const params = {
      Bucket: this.bucketName,
      Key: name,
    };
    return await this.storage
      .headObject(params)
      .promise()
      .then(res => res.ContentLength);
  }

  checkBucket(name: string): boolean {
    return true;
  }

  async fileExists(name: string): Promise<boolean> {
    return true;
  }
}
