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
  ListObjectVersionsCommand,
  // ListObjectVersionsCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  ConfigAmazonS3,
  AdapterConfig,
  StorageType,
  S3Compatible,
  ResultObjectStream,
  ResultObject,
  ResultObjectBuckets,
  FileBufferParams,
  FilePathParams,
  FileStreamParams,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectBoolean,
} from "./types";
import { parseUrl } from "./util";

export class AdapterAmazonS3 extends AbstractAdapter {
  protected _type = StorageType.S3;
  protected conf: ConfigAmazonS3;
  private configError: string | null = null;
  private storage: S3Client;
  private s3Compatible: S3Compatible = S3Compatible.Amazon;

  constructor(config: string | AdapterConfig) {
    super();
    this.conf = this.parseConfig(config as ConfigAmazonS3);

    // handle small differences in supported S3 compatible storages
    if (typeof (this.conf as ConfigAmazonS3).region === "undefined") {
      if (this.s3Compatible === S3Compatible.R2) {
        this.conf.region = "auto";
      } else if (this.s3Compatible === S3Compatible.Backblaze) {
        let ep = this.conf.endpoint;
        ep = ep.substring(ep.indexOf("s3.") + 3);
        this.conf.region = ep.substring(0, ep.indexOf("."));
      }
    }
    if (typeof this.conf.endpoint === "undefined") {
      this.storage = new S3Client({ region: this.conf.region });
    } else {
      this.storage = new S3Client({
        region: this.conf.region,
        endpoint: this.conf.endpoint,
        credentials: {
          accessKeyId: this.conf.accessKeyId,
          secretAccessKey: this.conf.secretAccessKey,
        },
      });
    }
  }

  private parseConfig(config: string | ConfigAmazonS3): ConfigAmazonS3 | null {
    let cfg: ConfigAmazonS3;
    if (typeof config === "string") {
      const { value, error } = parseUrl(config);
      if (error) {
        this.configError = error;
        return null;
      }
      const {
        type,
        part1: accessKeyId,
        part2: secretAccessKey,
        part3: region,
        bucketName,
        queryString,
      } = value;
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
      this.configError =
        "You must specify a value for both 'applicationKeyId' and  'applicationKey' for storage type 's3'";
      return null;
    }

    if (typeof cfg.endpoint !== "undefined") {
      if (cfg.endpoint.indexOf("r2.cloudflarestorage.com") !== -1) {
        this.s3Compatible = S3Compatible.R2;
      } else if (cfg.endpoint.indexOf("backblazeb2.com") !== -1) {
        this.s3Compatible = S3Compatible.Backblaze;
      }
    }
    if (!cfg.region && this.s3Compatible === S3Compatible.Amazon) {
      this.configError = "You must specify a default region for storage type 's3'";
      return null;
    }

    return cfg;
  }

  async getFileAsStream(
    bucketName: string,
    fileName: string,
    options: { start?: number; end?: number } = { start: 0 }
  ): Promise<ResultObjectStream> {
    if (this.configError !== null) {
      return { error: this.configError, value: null };
    }

    const params = {
      Bucket: bucketName,
      Key: fileName,
      Range: `bytes=${options.start}-${options.end || ""}`,
    };

    const command = new GetObjectCommand(params);
    try {
      const response = await this.storage.send(command);
      return { value: response.Body as Readable, error: null };
    } catch (e) {
      return { value: null, error: e.code };
    }
  }

  async removeFile(bucketName: string, fileName: string): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    const input = {
      Bucket: bucketName,
      Key: fileName,
    };
    const command = new DeleteObjectCommand(input);
    try {
      const response = await this.storage.send(command);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.code };
    }
  }

  async createBucket(name: string, options: object = {}): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const input = {
        Bucket: name,
      };
      const command = new HeadBucketCommand(input);
      const response = await this.storage.send(command);
      if (response.$metadata.httpStatusCode === 200) {
        return { error: "bucket exists", value: null };
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
      if (typeof this.conf.region !== "undefined" && this.conf.region !== "us-east-1") {
        input.CreateBucketConfiguration = {
          LocationConstraint: BucketLocationConstraint[this.conf.region.replace("-", "_")],
        };
      }

      const command = new CreateBucketCommand(input);
      const response = await this.storage.send(command);
      // console.log("response", response);
      if (response.$metadata.httpStatusCode === 200) {
        return { value: "ok", error: null };
      } else {
        return {
          error: `Error http status code ${response.$metadata.httpStatusCode}`,
          value: null,
        };
      }
    } catch (error) {
      return { error, value: null };
    }
  }

  async clearBucket(name: string): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const input1 = {
        Bucket: name,
        MaxKeys: 1000,
      };
      const command = new ListObjectVersionsCommand(input1);
      const { Versions } = await this.storage.send(command);
      // console.log("Versions", Versions);
      if (typeof Versions === "undefined") {
        return { value: "bucket is empty", error: null };
      }

      try {
        const input2 = {
          Bucket: name,
          Delete: {
            Objects: Versions.map((value) => ({
              Key: value.Key,
              VersionId: value.VersionId,
            })),
            Quiet: false,
          },
        };
        const command2 = new DeleteObjectsCommand(input2);
        await this.storage.send(command2);
        return { value: "ok", error: null };
      } catch (e) {
        return { value: null, error: e.code };
      }
    } catch (e) {
      return { value: null, error: e.code };
    }
  }

  async deleteBucket(name: string): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const input = {
        Bucket: name,
      };
      const command = new DeleteBucketCommand(input);
      const response = await this.storage.send(command);
      // console.log(response);
      return { value: "ok", error: null };
    } catch (e) {
      if (e.code === "NoSuchBucket") {
        return { value: "bucket not found", error: null };
      }
      return { value: "bucket not found", error: e.code };
    }
  }

  async listBuckets(): Promise<ResultObjectBuckets> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    const input = {};
    const command = new ListBucketsCommand(input);
    return this.storage
      .send(command)
      .then((response) => {
        const bucketNames = response.Buckets?.map((d) => d?.Name);
        return { value: bucketNames, error: null };
      })
      .catch((e) => {
        return { value: null, error: e.code };
      });
  }

  public async addFile(
    params: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    let { options } = params;
    if (typeof options !== "object") {
      options = {};
    }

    let fileData: Readable | Buffer;
    if (typeof (params as FilePathParams).origPath !== "undefined") {
      const f = (params as FilePathParams).origPath;
      if (!fs.existsSync(f)) {
        return { value: null, error: `File with given path: ${f}, was not found` };
      }
      fileData = fs.createReadStream(f);
    } else if (typeof (params as FileBufferParams).buffer !== "undefined") {
      fileData = (params as FileBufferParams).buffer;
    } else if (typeof (params as FileStreamParams).stream !== "undefined") {
      fileData = (params as FileStreamParams).stream;
    }

    try {
      const input = {
        Bucket: params.bucketName,
        Key: params.targetPath,
        Body: fileData,
        ...options,
      };
      const command = new PutObjectCommand(input);
      const response = await this.storage.send(command);
      return this.getFileAsURL(params.bucketName, params.targetPath);
    } catch (e) {
      return { value: null, error: e.code };
    }
  }

  async getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject> {
    return getSignedUrl(
      this.storage,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      })
      // { expiresIn: 3600 }
    )
      .then((url: string) => {
        return { value: url, error: null };
      })
      .catch((e) => {
        return { value: null, error: e.code };
      });
  }

  async listFiles(bucketName: string, maxFiles: number = 1000): Promise<ResultObjectFiles> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }
    try {
      const input = {
        Bucket: bucketName,
        MaxKeys: maxFiles,
      };
      const command = new ListObjectsCommand(input);
      const response = await this.storage.send(command);
      const { Contents } = response;
      if (!Contents) {
        return { value: [], error: null };
      }
      return { value: Contents.map((o) => [o.Key, o.Size]), error: null };
    } catch (e) {
      return { value: null, error: e.code };
    }
  }

  async sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const input = {
        Bucket: bucketName,
        Key: fileName,
      };
      const command = new HeadObjectCommand(input);
      const response = await this.storage.send(command);
      return { value: response.ContentLength, error: null };
    } catch (e) {
      return { value: null, error: e.code };
    }
  }

  async bucketExists(bucketName: string): Promise<ResultObjectBoolean> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    const input = {
      Bucket: bucketName,
    };
    const command = new HeadBucketCommand(input);
    return this.storage
      .send(command)
      .then(() => {
        return { value: true, error: null };
      })
      .catch(() => {
        return { value: false, error: null };
      });
  }

  async fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    const input = {
      Bucket: bucketName,
      Key: fileName,
    };
    const command = new HeadObjectCommand(input);
    return this.storage
      .send(command)
      .then(() => {
        return { value: true, error: null };
      })
      .catch(() => {
        return { value: false, error: null };
      });
  }
}
