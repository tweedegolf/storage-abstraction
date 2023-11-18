import fs from "fs";
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
import {
  BucketLocationConstraint,
  CreateBucketCommand,
  CreateBucketCommandInput,
  DeleteBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetBucketLocationCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  // ListObjectVersionsCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ConfigAmazonS3, AdapterConfig, StorageType, S3Compatible } from "./types";
import { parseUrl } from "./util";

export class AdapterAmazonS3 extends AbstractAdapter {
  protected type = StorageType.S3;
  private storage: S3Client;
  private bucketNames: string[] = [];
  private region: string = "";
  private s3Compatible: S3Compatible = S3Compatible.Amazon;
  protected configuration: ConfigAmazonS3;

  constructor(config: string | AdapterConfig) {
    super();
    this.configuration = this.parseConfig(config as ConfigAmazonS3);
    if (
      typeof this.configuration.bucketName !== "undefined" &&
      this.configuration.bucketName !== ""
    ) {
      const msg = this.validateName(this.configuration.bucketName);
      if (msg !== null) {
        throw new Error(msg);
      }
      this.bucketName = this.configuration.bucketName;
    }

    if (typeof (this.configuration as ConfigAmazonS3).region === "undefined") {
      if (this.s3Compatible === S3Compatible.R2) {
        this.configuration.region = "auto";
        this.region = this.configuration.region;
      } else if (this.s3Compatible === S3Compatible.Backblaze) {
        let ep = this.configuration.endpoint;
        ep = ep.substring(ep.indexOf("s3.") + 3);
        this.configuration.region = ep.substring(0, ep.indexOf("."));
        // console.log(this.config.region);
        this.region = this.configuration.region;
      }
    } else {
      this.region = (this.configuration as ConfigAmazonS3).region;
    }
    if (typeof this.configuration.endpoint === "undefined") {
      this.storage = new S3Client({ region: this.region });
    } else {
      this.storage = new S3Client({
        region: this.region,
        endpoint: this.configuration.endpoint,
        credentials: {
          accessKeyId: this.configuration.accessKeyId,
          secretAccessKey: this.configuration.secretAccessKey,
        },
      });
    }
  }

  async init(): Promise<boolean> {
    if (this.initialized) {
      return Promise.resolve(true);
    }
    if (this.bucketName) {
      await this.createBucket(this.bucketName)
        .then((_data) => {
          this.bucketNames.push(this.bucketName);
        })
        .catch((message: string) => {
          return Promise.reject(message);
        });
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

    if (typeof cfg.endpoint !== "undefined") {
      if (cfg.endpoint.indexOf("r2.cloudflarestorage.com") !== -1) {
        this.s3Compatible = S3Compatible.R2;
      } else if (cfg.endpoint.indexOf("backblazeb2.com") !== -1) {
        this.s3Compatible = S3Compatible.Backblaze;
      }
    }
    if (!cfg.region && this.s3Compatible === S3Compatible.Amazon) {
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

    const command = new GetObjectCommand(params);
    const response = await this.storage.send(command);
    return response.Body as Readable;
  }

  async removeFile(fileName: string): Promise<string> {
    const input = {
      Bucket: this.bucketName,
      Key: fileName,
    };
    const command = new DeleteObjectCommand(input);
    const response = await this.storage.send(command);
    // console.log(response);
    return "file removed";
  }

  // util members

  async createBucket(name: string, options: object = {}): Promise<string> {
    // return Promise.reject("oops");
    const msg = this.validateName(name);
    if (msg !== null) {
      return Promise.reject(msg);
    }

    if (this.bucketNames.findIndex((b) => b === name) !== -1) {
      return "bucket exists";
    }

    try {
      const input = {
        Bucket: name,
      };
      const command = new HeadBucketCommand(input);
      const response = await this.storage.send(command);
      if (response.$metadata.httpStatusCode === 200) {
        // console.log("response", response);
        this.bucketNames.push(name);
        this.bucketName = name;
        return "bucket exists";
      }
    } catch (_e) {
      // this error simply means that the bucket doesn't exist yet
      // so it is safe to ignore it and continue
    }

    try {
      const input: CreateBucketCommandInput = {
        Bucket: name,
        ...options,
      };
      // see issue: https://github.com/aws/aws-sdk-js/issues/3647
      if (
        typeof this.configuration.region !== "undefined" &&
        this.configuration.region !== "us-east-1"
      ) {
        input.CreateBucketConfiguration = {
          LocationConstraint: BucketLocationConstraint[this.configuration.region.replace("-", "_")],
        };
      }

      const command = new CreateBucketCommand(input);
      const response = await this.storage.send(command);
      // console.log("response", response);
      if (response.$metadata.httpStatusCode === 200) {
        this.bucketNames.push(name);
        this.bucketName = name;
        return "bucket created";
      }
    } catch (e) {
      return Promise.reject(e.message);
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

    /*
    const input1 = {
      Bucket: n,
      MaxKeys: 1000,
    };
    const command = new ListObjectVersionsCommand(input1);
    const { Versions } = await this.storage.send(command);
    // console.log("Versions", Versions);
    if (typeof Versions === "undefined") {
      return "bucket is empty";
    }
    const input2 = {
      Bucket: n,
      Delete: {
        Objects: Versions.map((value) => ({
          Key: value.Key,
          VersionId: value.VersionId,
        })),
        Quiet: false,
      },
    };
    const command2 = new DeleteObjectsCommand(input2);
    const response = await this.storage.send(command2);
    return "bucket cleared";
    */

    const input1 = {
      Bucket: n,
      MaxKeys: 1000,
    };
    const command1 = new ListObjectsCommand(input1);
    const response1 = await this.storage.send(command1);
    const Contents = response1.Contents;

    if (!Contents || Contents.length === 0) {
      return;
    }
    // console.log(Contents);
    const input2 = {
      Bucket: n,
      Delete: {
        Objects: Contents.map((value) => ({ Key: value.Key })),
        Quiet: false,
      },
    };
    const command2 = new DeleteObjectsCommand(input2);
    const response = await this.storage.send(command2);
    // console.log(response);
    return "bucket cleared";
  }

  async deleteBucket(name?: string): Promise<string> {
    const n = name || this.bucketName;
    // console.log("deleteBucket", n);

    if (n === "") {
      throw new Error("deleteBucket: no bucket selected");
    }
    try {
      const input = {
        Bucket: n,
      };
      const command = new DeleteBucketCommand(input);
      const response = await this.storage.send(command);
      // console.log(response);

      if (n === this.bucketName) {
        this.bucketName = "";
      }
      // console.log("selected bucket", this.bucketName);
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
    const input = {};
    const command = new ListBucketsCommand(input);
    return this.storage
      .send(command)
      .then((response) => {
        this.bucketNames = response.Buckets?.map((d) => d?.Name);
        return this.bucketNames;
      })
      .catch((e) => {
        console.log("[ERROR listBuckets]", e);
        return [];
      });
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

    const input = {
      ...options,
      Bucket: this.bucketName,
      Key: targetPath,
      Body: arg,
    };

    if (typeof arg === "string") {
      if (!fs.existsSync(arg)) {
        throw new Error(`File with given path: ${arg}, was not found`);
      }
      input.Body = fs.createReadStream(arg);
    }

    const command = new PutObjectCommand(input);
    const response = await this.storage.send(command);

    if (this.region !== "") {
      const input = {
        Bucket: this.bucketName,
      };
      const command = new GetBucketLocationCommand(input);
      const response = await this.storage.send(command);
      this.region = response.LocationConstraint;
    }
    // return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${targetPath}`;
    return await getSignedUrl(
      this.storage,
      new GetObjectCommand({ Bucket: this.bucketName, Key: targetPath })
      // { expiresIn: 3600 }
    );
  }

  async listFiles(maxFiles: number = 1000): Promise<[string, number][]> {
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }

    const input = {
      Bucket: this.bucketName,
      MaxKeys: maxFiles,
    };
    const command = new ListObjectsCommand(input);
    const response = await this.storage.send(command);
    const { Contents } = response;
    if (!Contents) {
      return [];
    }
    return Contents.map((o) => [o.Key, o.Size]) as [string, number][];
  }

  async sizeOf(name: string): Promise<number> {
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }

    const input = {
      Bucket: this.bucketName,
      Key: name,
    };
    const command = new HeadObjectCommand(input);
    const response = await this.storage.send(command);
    return response.ContentLength;
  }

  async fileExists(name: string): Promise<boolean> {
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }

    const input = {
      Bucket: this.bucketName,
      Key: name,
    };
    const command = new HeadObjectCommand(input);
    return this.storage
      .send(command)
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  }
}
