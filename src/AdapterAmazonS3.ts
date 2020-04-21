import fs from "fs";
import { Readable } from "stream";
import S3 from "aws-sdk/clients/s3";
import { AbstractAdapter } from "./AbstractAdapter";
import { ConfigAmazonS3, AdapterConfig, StorageType } from "./types";
import { parseUrl } from "./util";

export class AdapterAmazonS3 extends AbstractAdapter {
  protected type = StorageType.S3;
  // protected config: ConfigAmazonS3;
  // protected bucketName: string;
  private storage: S3;
  private bucketNames: string[] = [];
  // private apiVersion = "2006-03-01";

  constructor(config: string | AdapterConfig) {
    super();
    const cfg = this.parseConfig(config as ConfigAmazonS3);
    this.config = { ...cfg };
    if (cfg.slug) {
      this.slug = cfg.slug;
      delete cfg.slug;
    }
    if (cfg.bucketName) {
      this.bucketName = this.generateSlug(cfg.bucketName, this.slug);
      delete cfg.bucketName;
    }
    delete cfg.type;
    this.storage = new S3(cfg);
  }

  async init(): Promise<boolean> {
    if (this.bucketName) {
      await this.createBucket(this.bucketName);
      this.bucketNames.push(this.bucketName);
    }
    // no further initialization required
    this.initialized = true;
    return Promise.resolve(true);
  }

  private parseConfig(config: string | ConfigAmazonS3): ConfigAmazonS3 {
    let cfg: ConfigAmazonS3;
    if (typeof config === "string") {
      const {
        type,
        part1: accessKeyId,
        part2: secretAccessKey,
        part3: region,
        bucketName,
        queryString,
      } = parseUrl(config);
      cfg = {
        type,
        accessKeyId,
        secretAccessKey,
        region,
        bucketName,
        ...queryString,
      };
    } else {
      cfg = { ...config };
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

  async removeFile(fileName: string): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: fileName,
    };
    await this.storage.deleteObject(params).promise();
    return "file removed";
  }

  // util members

  async createBucket(name: string): Promise<string> {
    const msg = this.validateName(name);
    if (msg !== null) {
      return Promise.reject(msg);
    }

    const n = this.generateSlug(name);
    if (this.bucketNames.findIndex(b => b === n) !== -1) {
      return;
    }

    try {
      await this.storage.headBucket({ Bucket: n }).promise();
      // console.log("HEAD BUCKET", n, this.bucketNames);
      this.bucketNames.push(n);
    } catch (e) {
      // console.log(e);
      if (e.code === "Forbidden") {
        // BucketAlreadyExists
        const msg = [
          "The requested bucket name is not available.",
          "The bucket namespace is shared by all users of the system.",
          "Please select a different name and try again.",
        ];
        return Promise.reject(msg.join(" "));
      }
      const data = await this.storage.createBucket({ Bucket: n }).promise();
      this.bucketNames.push(n);
    }
  }

  async selectBucket(name: string | null): Promise<string> {
    // add check if bucket exists!
    if (name === null) {
      this.bucketName = "";
      return "bucket deselected";
    }
    await this.createBucket(name);
    this.bucketName = name;
    return "bucket selected";
  }

  async clearBucket(name?: string): Promise<string> {
    let n = name || this.bucketName;
    n = this.generateSlug(n);

    if (!n) {
      throw new Error("no bucket selected");
    }
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
    return "bucket cleared";
  }

  async deleteBucket(name?: string): Promise<string> {
    let n = name || this.bucketName;
    n = this.generateSlug(n);
    // try {
    //   const data = await this.storage.listObjectVersions({ Bucket: n }).promise();
    //   console.log(data);
    //   return true;
    // } catch (e) {
    //   throw e;
    // }
    if (n === "") {
      throw new Error("no bucket selected");
    }
    try {
      await this.clearBucket(name);
      const result = await this.storage
        .deleteBucket({
          Bucket: n,
        })
        .promise();
      if (n === this.bucketName) {
        this.bucketName = "";
      }
      this.bucketNames = this.bucketNames.filter(b => b !== n);
      return "bucket deleted";
      // console.log(this.buckets, result);
    } catch (e) {
      if (e.code === "NoSuchBucket") {
        throw new Error("bucket not found");
      }
      throw e;
    }
  }

  async listBuckets(): Promise<string[]> {
    const data = await this.storage.listBuckets().promise();
    this.bucketNames = data.Buckets.map(d => d.Name);
    return this.bucketNames;
  }

  protected async store(buffer: Buffer, targetPath: string): Promise<void>;
  protected async store(stream: Readable, targetPath: string): Promise<void>;
  protected async store(origPath: string, targetPath: string): Promise<void>;
  protected async store(arg: string | Buffer | Readable, targetPath: string): Promise<void> {
    if (!this.bucketName) {
      throw new Error("no bucket selected");
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
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }
    const params = {
      Bucket: this.bucketName,
      MaxKeys: maxFiles,
    };
    const { Contents: content } = await this.storage.listObjects(params).promise();
    return content.map(o => [o.Key, o.Size]) as [string, number][];
  }

  async sizeOf(name: string): Promise<number> {
    if (!this.bucketName) {
      throw new Error("no bucket selected");
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

  async fileExists(name: string): Promise<boolean> {
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }
    const params = {
      Bucket: this.bucketName,
      Key: name,
    };
    return await this.storage
      .headObject(params)
      .promise()
      .then(() => true)
      .catch(() => false);
  }
}
