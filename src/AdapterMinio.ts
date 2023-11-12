/*
import * as Minio from "minio";
import fs from "fs";
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
import { AdapterConfig, StorageType, ConfigMinioS3 } from "./types";
import { parseUrl } from "./util";
import { MakeBucketOpt } from "minio";

// WIP
export class AdapterMinio extends AbstractAdapter {
  protected type = StorageType.MINIO;
  protected storage: Minio.Client;
  protected config: ConfigMinioS3;
  private bucketNames: string[] = [];
  private region: string = "";

  constructor(config: string | AdapterConfig) {
    super();
    this.config = this.parseConfig(config as ConfigMinioS3);
    if (typeof this.config.bucketName !== "undefined") {
      const msg = this.validateName(this.config.bucketName);
      if (msg !== null) {
        throw new Error(msg);
      }
      this.bucketName = this.config.bucketName;
    }
    if (typeof (this.config as ConfigMinioS3).region !== "undefined") {
      this.region = (this.config as ConfigMinioS3).region;
    }
    this.storage = new Minio.Client({
      region: "auto",
      endPoint: this.config.endPoint,
      port: 9001,
      useSSL: false,
      accessKey: this.config.accessKeyId,
      secretKey: this.config.secretAccessKey,
    });
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

  private parseConfig(config: string | ConfigMinioS3): ConfigMinioS3 {
    let cfg: ConfigMinioS3;
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

    return (await this.storage.getObject(this.bucketName, fileName)) as Readable;
  }

  async removeFile(fileName: string): Promise<string> {
    await this.storage.removeObject(this.bucketName, fileName);
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
      await this.storage.bucketExists(name);
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
      this.storage.makeBucket(name, this.config.region, options as MakeBucketOpt, () => {
        this.bucketNames.push(name);
      });
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
    return new Promise((resolve, reject) => {
      const n = name || this.bucketName;

      if (!n) {
        throw new Error("no bucket selected");
      }
      const data = [];
      const stream = this.storage.listObjects(n);
      stream.on("data", function (obj) {
        data.push(obj);
      });

      stream.on("end", function () {
        this.storage.removeObjects(n, data, (e) => {
          if (e) {
            throw new Error(e);
          } else {
            return "bucket cleared";
          }
        });
      });
    });
  }

  async deleteBucket(name?: string): Promise<string> {
    const n = name || this.bucketName;

    if (n === "") {
      throw new Error("no bucket selected");
    }
    try {
      await this.clearBucket(name);
      await this.storage.removeBucket(n);

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
    const buckets = await this.storage.listBuckets();
    this.bucketNames = buckets.map((d) => d.name);
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

*/
