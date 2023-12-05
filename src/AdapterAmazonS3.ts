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
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListObjectVersionsCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  AdapterConfig,
  StorageType,
  ResultObjectStream,
  ResultObject,
  ResultObjectBuckets,
  FileBufferParams,
  FilePathParams,
  FileStreamParams,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectBoolean,
  Options,
} from "./types";

export class AdapterAmazonS3 extends AbstractAdapter {
  protected _type = StorageType.S3;
  protected _config: AdapterConfig;
  protected _configError: string | null = null;
  protected _storage: S3Client;

  constructor(config?: string | AdapterConfig) {
    super(config);
    if (this._configError === null) {
      this._storage = new S3Client(this.config);
      console.log(this.storage.config);
    }
  }

  get storage(): S3Client {
    return this._storage as S3Client;
  }

  public async getFileAsStream(
    bucketName: string,
    fileName: string,
    options: Options = { start: 0 }
  ): Promise<ResultObjectStream> {
    if (this.configError !== null) {
      return { error: this.configError, value: null };
    }

    let range = "";

    if (typeof options.end !== "undefined") {
      range = `bytes=${options.start}-${options.end}`;
    }
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Range: range,
    };

    const command = new GetObjectCommand(params);
    try {
      const response = await this.storage.send(command);
      return { value: response.Body as Readable, error: null };
    } catch (e) {
      return { value: null, error: e.code };
    }
  }

  public async removeFile(bucketName: string, fileName: string): Promise<ResultObject> {
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

  public async createBucket(name: string, options: object = {}): Promise<ResultObject> {
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
      if (typeof this._config.region === "string" && this._config.region !== "us-east-1") {
        input.CreateBucketConfiguration = {
          LocationConstraint: BucketLocationConstraint[this._config.region.replace("-", "_")],
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

  public async clearBucket(name: string): Promise<ResultObject> {
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

  public async deleteBucket(name: string): Promise<ResultObject> {
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

  public async listBuckets(): Promise<ResultObjectBuckets> {
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

  public async getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject> {
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

  public async listFiles(bucketName: string, maxFiles: number = 1000): Promise<ResultObjectFiles> {
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

  public async sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
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

  public async bucketExists(bucketName: string): Promise<ResultObjectBoolean> {
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

  public async fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
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
