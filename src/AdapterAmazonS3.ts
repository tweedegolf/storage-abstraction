import fs from "fs";
import { Readable } from "stream";
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
  ObjectVersion,
  PutObjectCommand,
  S3Client,
  _Object,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AbstractAdapter } from "./AbstractAdapter";
import { Options, StreamOptions, StorageType } from "./types/general";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params";
import {
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectStream,
} from "./types/result";
import { AdapterConfigAmazonS3 } from "./types/adapter_amazon_s3";

import { validateName } from "./util";

export class AdapterAmazonS3 extends AbstractAdapter {
  protected _type = StorageType.S3;
  protected _config: AdapterConfigAmazonS3;
  protected _configError: string | null = null;
  protected _client: S3Client;

  constructor(config: string | AdapterConfigAmazonS3) {
    super(config);
    if (this._configError === null) {
      if (this.config.accessKeyId && this.config.secretAccessKey) {
        const o: { [id: string]: any } = { ...this.config }; // eslint-disable-line
        delete o.credentials;
        delete o.accessKeyId;
        delete o.secretAccessKey;
        this._client = new S3Client({
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
        this._client = new S3Client(o);
      }
    }
  }

  private async getFiles(
    name: string,
    maxFiles: number = 10000
  ): Promise<{ value: Array<_Object> | null; error: string | null }> {
    try {
      const input = {
        Bucket: name,
        MaxKeys: maxFiles,
      };
      const command = new ListObjectsCommand(input);
      const { Contents } = await this._client.send(command);
      // console.log("Contents", Contents);
      return { value: Contents, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  private async getFileVersions(
    name: string,
    maxFiles: number = 10000
  ): Promise<{ value: Array<ObjectVersion> | null; error: string | null }> {
    try {
      const input = {
        Bucket: name,
        MaxKeys: maxFiles,
      };
      const command = new ListObjectVersionsCommand(input);
      const { Versions } = await this._client.send(command);
      // console.log("Versions", Versions);
      return { value: Versions, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  get config(): AdapterConfigAmazonS3 {
    return this._config as AdapterConfigAmazonS3;
  }

  get serviceClient(): S3Client {
    return this._client as S3Client;
  }

  public async getFileAsStream(
    bucketName: string,
    fileName: string,
    options?: StreamOptions
  ): Promise<ResultObjectStream> {
    if (this.configError !== null) {
      return { error: this.configError, value: null };
    }

    const { start, end } = options;
    let range = `bytes=${start}-${end}`;
    if (typeof start === "undefined" && typeof end === "undefined") {
      range = undefined;
    } else if (typeof start === "undefined") {
      range = `bytes=0-${end}`;
    } else if (typeof end === "undefined") {
      range = `bytes=${start}-`;
    }

    try {
      const params = {
        Bucket: bucketName,
        Key: fileName,
        Range: range,
      };
      const command = new GetObjectCommand(params);
      const response = await this._client.send(command);
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
      const response = await this._client.send(command);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async createBucket(name: string, options: Options = {}): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    const error = validateName(name);
    if (error !== null) {
      return { value: null, error };
    }

    try {
      const input = {
        Bucket: name,
      };
      const command = new HeadBucketCommand(input);
      const response = await this._client.send(command);
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
      const response = await this._client.send(command);
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

    let objects: Array<{ Key: string; VersionId?: string }>;

    // first try to remove the versioned files
    const { value, error } = await this.getFileVersions(name);
    if (error === "no versions" || error === "ListObjectVersions not implemented") {
      // if that fails remove non-versioned files
      const { value, error } = await this.getFiles(name);
      if (error === "no contents") {
        return { value: null, error: "Could not remove files" };
      } else if (error !== null) {
        return { value: null, error };
      } else if (typeof value !== "undefined") {
        objects = value.map((value) => ({ Key: value.Key }));
      }
    } else if (error !== null) {
      return { value: null, error };
    } else if (typeof value !== "undefined") {
      objects = value.map((value) => ({ Key: value.Key, VersionId: value.VersionId }));
    }

    if (typeof objects !== "undefined") {
      try {
        const input = {
          Bucket: name,
          Delete: {
            Objects: objects,
            Quiet: false,
          },
        };
        const command = new DeleteObjectsCommand(input);
        await this._client.send(command);
        return { value: "ok", error: null };
      } catch (e) {
        return { value: null, error: e.message };
      }
    }

    return { value: "ok", error: null };
  }

  public async deleteBucket(name: string): Promise<ResultObject> {
    try {
      await this.clearBucket(name);
      const input = {
        Bucket: name,
      };
      const command = new DeleteBucketCommand(input);
      const response = await this._client.send(command);
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
      const response = await this._client.send(command);
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
      const response = await this._client.send(command);
      return this.getFileAsURL(params.bucketName, params.targetPath);
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async getFileAsURL(
    bucketName: string,
    fileName: string,
    options?: Options // e.g. { expiresIn: 3600 }
  ): Promise<ResultObject> {
    try {
      const url = await getSignedUrl(
        this._client,
        new GetObjectCommand({
          Bucket: bucketName,
          Key: fileName,
        }),
        options
      );
      return { value: url, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async listFiles(bucketName: string, maxFiles: number = 10000): Promise<ResultObjectFiles> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const { value, error } = await this.getFiles(bucketName, maxFiles);
      if (error !== null) {
        return { value: null, error };
      }
      if (typeof value === "undefined") {
        return { value: [], error: null };
      }
      return { value: value.map((o) => [o.Key, o.Size]), error: null };
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
      const response = await this._client.send(command);
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
      await this._client.send(command);
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
      await this._client.send(command);
      return { value: true, error: null };
    } catch (e) {
      return { value: false, error: null };
    }
  }
}
