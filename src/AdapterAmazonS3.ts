import fs from "fs";
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
import { S3 } from "@aws-sdk/client-s3";
import { ConfigAmazonS3, AdapterConfig, StorageType } from "./types";
import { parseUrl } from "./util";

export class AdapterAmazonS3 extends AbstractAdapter {
  protected type = StorageType.S3;
  private storage: S3;
  private bucketNames: string[] = [];
  private region: string = "";

  constructor(config: string | AdapterConfig) {
    super();
    this.config = this.parseConfig(config as ConfigAmazonS3);
    if (typeof this.config.bucketName !== "undefined") {
      const msg = this.validateName(this.config.bucketName);
      if (msg !== null) {
        throw new Error(msg);
      }
      this.bucketName = this.config.bucketName;
    }
    if (typeof (this.config as ConfigAmazonS3).region !== "undefined") {
      this.region = (this.config as ConfigAmazonS3).region;
    }
    this.storage = new S3(this.config);
  }

  async init(): Promise<boolean> {
    if (this.initialized) {
      return Promise.resolve(true);
    }
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

    if (cfg.skipCheck === true) {
      return cfg;
    }

    if (!cfg.accessKeyId || !cfg.secretAccessKey) {
      throw new Error(
        "You must specify a value for both 'applicationKeyId' and  'applicationKey' for storage type 's3'"
      );
    }

    if (!cfg.region) {
      throw new Error("You must specify a default region for storage type 's3'");
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
      Range: `bytes=${options.start}-${options.end || ""}`,
    };

    await this.storage.headObject(params);
    return (await this.storage.getObject(params)).Body as Readable;
  }

  async removeFile(fileName: string): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: fileName,
    };
    await this.storage.deleteObject(params);
    return "file removed";
  }

  // util members

  async createBucket(name: string, options: object = {}): Promise<string> {
    const msg = this.validateName(name);
    if (msg !== null) {
      return Promise.reject(msg);
    }

    if (this.bucketNames.findIndex((b) => b === name) !== -1) {
      return;
    }

    try {
      await this.storage.headBucket({ Bucket: name });
      this.bucketNames.push(name);
    } catch (e) {
      if (e.code === "Forbidden") {
        // BucketAlreadyExists
        console.log(e);
        const msg = [
          "The requested bucket name is not available.",
          "The bucket namespace is shared by all users of the system.",
          "Please select a different name and try again.",
        ];
        return Promise.reject(msg.join(" "));
      }
      await this.storage.createBucket({
        ...options,
        Bucket: name,
      });
      this.bucketNames.push(name);
    }
  }

  async selectBucket(name: string | null): Promise<string> {
    // add check if bucket exists!
    if (!name) {
      this.bucketName = "";
      return `bucket '${name}' deselected`;
    }
    await this.createBucket(name);
    this.bucketName = name;
    return `bucket '${name}' selected`;
  }

  async clearBucket(name?: string): Promise<string> {
    const n = name || this.bucketName;

    if (!n) {
      throw new Error("no bucket selected");
    }
    const params1 = {
      Bucket: n,
      MaxKeys: 1000,
    };

    const { Contents } = await this.storage.listObjects(params1);

    if (!Contents || Contents.length === 0) {
      return;
    }

    const params2 = {
      Bucket: n,
      Delete: {
        Objects: Contents.map((value) => ({ Key: value.Key })),
        Quiet: false,
      },
    };
    await this.storage.deleteObjects(params2);
    return "bucket cleared";
  }

  async deleteBucket(name?: string): Promise<string> {
    const n = name || this.bucketName;

    if (n === "") {
      throw new Error("no bucket selected");
    }
    try {
      await this.clearBucket(name);
      await this.storage.deleteBucket({ Bucket: n });

      if (n === this.bucketName) {
        this.bucketName = "";
      }

      this.bucketNames = this.bucketNames.filter((b) => b !== n);

      return "bucket deleted";
    } catch (e) {
      if (e.code === "NoSuchBucket") {
        throw new Error("bucket not found");
      }
      throw e;
    }
  }

  async listBuckets(): Promise<string[]> {
    const data = await this.storage.listBuckets({});
    this.bucketNames = data.Buckets.map((d) => d.Name);
    return this.bucketNames;
  }

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
    if (typeof options !== "object") {
      options = {};
    }
    await this.createBucket(this.bucketName);

    const params = {
      ...options,
      Bucket: this.bucketName,
      Key: targetPath,
      Body: arg,
    };

    if (typeof arg === "string") {
      if (!fs.existsSync(arg)) {
        throw new Error(`File with given path: ${arg}, was not found`);
      }
      params.Body = fs.createReadStream(arg);
    }

    await this.storage.putObject(params);
    if (this.region !== "") {
      this.region = (
        await this.storage.getBucketLocation({ Bucket: this.bucketName })
      ).LocationConstraint;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${targetPath}`;
  }

  async listFiles(maxFiles: number = 1000): Promise<[string, number][]> {
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }

    const params = {
      Bucket: this.bucketName,
      MaxKeys: maxFiles,
    };

    const { Contents } = await this.storage.listObjects(params);

    if (!Contents) {
      return [];
    }

    return Contents.map((o) => [o.Key, o.Size]) as [string, number][];
  }

  async sizeOf(name: string): Promise<number> {
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }

    const params = {
      Bucket: this.bucketName,
      Key: name,
    };

    return await this.storage.headObject(params).then((res) => res.ContentLength);
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
      .then(() => true)
      .catch(() => false);
  }
}
