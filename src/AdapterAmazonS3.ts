import fs from "fs";
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
import {
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
  AdapterConfigS3,
} from "./types";

export class AdapterAmazonS3 extends AbstractAdapter {
  protected _type = StorageType.S3;
  protected _config: AdapterConfigS3;
  protected _configError: string | null = null;
  protected _storage: S3Client;

  constructor(config?: string | AdapterConfig) {
    super(config);
    if (this._configError === null) {
      if (this.config.accessKeyId && this.config.secretAccessKey) {
        const o: { [id: string]: any } = { ...this.config }; // eslint-disable-line
        delete o.credentials;
        delete o.accessKeyId;
        delete o.secretAccessKey;
        this._storage = new S3Client({
          credentials: {
            accessKeyId: this.config.accessKeyId,
            secretAccessKey: this.config.secretAccessKey,
          },
          ...o,
        });
      } else {
        const o: { [id: string]: any } = { ...this.config }; // eslint-disable-line
        delete o.accessKeyId;
        delete o.secretAccessKey;
        this._storage = new S3Client(o);
      }
      // console.log(this.storage.config);
    }
  }

  get config(): AdapterConfigS3 {
    return this._config as AdapterConfigS3;
  }

  get storage(): S3Client {
    return this._storage as S3Client;
  }

  public async getFileAsStream(
    bucketName: string,
    fileName: string,
    options: Options = { start: 0, end: "" }
  ): Promise<ResultObjectStream> {
    if (this.configError !== null) {
      return { error: this.configError, value: null };
    }

    let { start, end } = options;
    if (typeof start === "undefined") {
      start = 0;
    }
    if (typeof end === "undefined") {
      end = "";
    }

    try {
      const params = {
        Bucket: bucketName,
        Key: fileName,
        Range: `bytes=${start}-${end}`,
      };
      const command = new GetObjectCommand(params);
      const response = await this.storage.send(command);
      return { value: response.Body as Readable, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async removeFile(bucketName: string, fileName: string): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const input = {
        Bucket: bucketName,
        Key: fileName,
      };
      const command = new DeleteObjectCommand(input);
      const response = await this.storage.send(command);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
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
      const command = new CreateBucketCommand(input);
      const response = await this.storage.send(command);
      // console.log("response", response);
      if (response.$metadata.httpStatusCode === 200) {
        return { value: "ok", error: null };
      } else {
        return {
          value: null,
          error: `Error http status code ${response.$metadata.httpStatusCode}`,
        };
      }
    } catch (e) {
      return { value: null, error: e.message };
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
        return { value: "ok", error: null };
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
        return { value: null, error: e.message };
      }
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async deleteBucket(name: string): Promise<ResultObject> {
    try {
      await this.clearBucket(name);
      const input = {
        Bucket: name,
      };
      const command = new DeleteBucketCommand(input);
      const response = await this.storage.send(command);
      // console.log(response);
      return { value: "ok", error: null };
    } catch (e) {
      if (e.message === "NoSuchBucket") {
        return { value: "bucket not found", error: null };
      }
      return { value: null, error: e.message };
    }
  }

  public async listBuckets(): Promise<ResultObjectBuckets> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const input = {};
      const command = new ListBucketsCommand(input);
      const response = await this.storage.send(command);
      const bucketNames = response.Buckets?.map((b) => b?.Name);
      return { value: bucketNames, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
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

    try {
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
      return { value: null, error: e.message };
    }
  }

  public async getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject> {
    try {
      const url = await getSignedUrl(
        this.storage,
        new GetObjectCommand({
          Bucket: bucketName,
          Key: fileName,
        })
        // { expiresIn: 3600 }
      );
      return { value: url, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
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
      return { value: null, error: e.message };
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
      return { value: null, error: e.message };
    }
  }

  public async bucketExists(bucketName: string): Promise<ResultObjectBoolean> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const input = {
        Bucket: bucketName,
      };
      const command = new HeadBucketCommand(input);
      await this.storage.send(command);
      return { value: true, error: null };
    } catch (e) {
      return { value: false, error: null };
    }
  }

  public async fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const input = {
        Bucket: bucketName,
        Key: fileName,
      };
      const command = new HeadObjectCommand(input);
      await this.storage.send(command);
      return { value: true, error: null };
    } catch (e) {
      return { value: false, error: null };
    }
  }
}
