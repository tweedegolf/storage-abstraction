import fs from "fs";
import { Readable } from "stream";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3Client,
  _Object,
  ListObjectsCommand,
  ObjectVersion,
  ListObjectVersionsCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommandInput,
  CreateBucketCommand,
  DeleteObjectsCommand,
  DeleteBucketCommand,
  ListBucketsCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
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
import { parseUrl, validateName } from "./util";

export class AdapterAmazonS3 extends AbstractAdapter {
  protected _type = StorageType.S3;
  protected _config: AdapterConfigAmazonS3;
  protected _configError: string | null = null;
  protected _client: S3Client;

  constructor(config?: string | AdapterConfigAmazonS3) {
    super(config);
    if (typeof config !== "string") {
      this._config = { ...config };
    } else {
      const { value, error } = parseUrl(config);
      if (error !== null) {
        this._configError = `[configError] ${error}`;
      } else {
        const {
          protocol: type,
          username: accessKeyId,
          password: secretAccessKey,
          host: bucketName,
          searchParams,
        } = value;
        if (searchParams !== null) {
          this._config = { type, ...searchParams };
        } else {
          this._config = { type };
        }
        if (accessKeyId !== null) {
          this._config.accessKeyId = accessKeyId;
        }
        if (secretAccessKey !== null) {
          this._config.secretAccessKey = secretAccessKey;
        }
        if (bucketName !== null) {
          this._config.bucketName = bucketName;
        }
      }
      // console.log(this._config);
    }

    try {
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
    } catch (e) {
      this._configError = `[configError] ${e.message}`;
    }

    if (typeof this.config.bucketName !== "undefined") {
      this._bucketName = this.config.bucketName;
    }
  }

  private async getFiles(
    bucketName: string,
    maxFiles: number = 10000
  ): Promise<{ value: Array<_Object> | null; error: string | null }> {
    try {
      const input = {
        Bucket: bucketName,
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
    bucketName: string,
    maxFiles: number = 10000
  ): Promise<{ value: Array<ObjectVersion> | null; error: string | null }> {
    try {
      const input = {
        Bucket: bucketName,
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

  // protected, called by methods of public API via AbstractAdapter

  protected async _getFileAsStream(
    bucketName: string,
    fileName: string,
    options: StreamOptions
  ): Promise<ResultObjectStream> {
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

  protected async _removeFile(
    bucketName: string,
    fileName: string,
    allVersions: boolean
  ): Promise<ResultObject> {
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

  protected async _clearBucket(bucketName: string): Promise<ResultObject> {
    let objects: Array<{ Key: string; VersionId?: string }>;

    // first try to remove the versioned files
    const { value, error } = await this.getFileVersions(bucketName);
    if (error === "no versions" || error === "ListObjectVersions not implemented") {
      // if that fails remove non-versioned files
      const { value, error } = await this.getFiles(bucketName);
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
      objects = value.map((value) => ({
        Key: value.Key,
        VersionId: value.VersionId,
      }));
    }

    if (typeof objects !== "undefined") {
      try {
        const input = {
          Bucket: bucketName,
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

  protected async _deleteBucket(bucketName: string): Promise<ResultObject> {
    try {
      await this.clearBucket(bucketName);
      const input = {
        Bucket: bucketName,
      };
      const command = new DeleteBucketCommand(input);
      const response = await this._client.send(command);
      // console.log(response);
      return { value: "ok", error: null };
    } catch (e) {
      // error message Cubbit
      if (e.message === "NoSuchBucket") {
        return { value: null, error: `The specified bucket does not exist: ${bucketName}` };
      }
      return { value: null, error: e.message };
    }
  }

  protected async _addFile(
    params: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    try {
      let fileData: Readable | Buffer;
      if (typeof (params as FilePathParams).origPath !== "undefined") {
        const f = (params as FilePathParams).origPath;
        if (!fs.existsSync(f)) {
          return {
            value: null,
            error: `File with given path: ${f}, was not found`,
          };
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
        ...params.options,
      };
      const command = new PutObjectCommand(input);
      const response = await this._client.send(command);
      return this._getFileAsURL(params.bucketName, params.targetPath, params.options);
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _getFileAsURL(
    bucketName: string,
    fileName: string,
    options: Options // e.g. { expiresIn: 3600 }
  ): Promise<ResultObject> {
    try {
      let url = "";
      if (options.useSignedUrl) {
        url = await getSignedUrl(
          this._client,
          new GetObjectCommand({
            Bucket: bucketName,
            Key: fileName,
          }),
          options
        );
      } else {
        url = `https://${bucketName}.s3.${this.config.region}.amazonaws.com/${fileName}`;
      }
      return { value: url, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _listFiles(bucketName: string, numFiles: number): Promise<ResultObjectFiles> {
    try {
      const { value, error } = await this.getFiles(bucketName, numFiles);
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

  protected async _sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
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

  protected async _bucketExists(bucketName: string): Promise<ResultObjectBoolean> {
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

  protected async _fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
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

  // public

  get config(): AdapterConfigAmazonS3 {
    return this._config as AdapterConfigAmazonS3;
  }

  getConfig(): AdapterConfigAmazonS3 {
    return this._config as AdapterConfigAmazonS3;
  }

  get serviceClient(): S3Client {
    return this._client as S3Client;
  }

  getServiceClient(): S3Client {
    return this._client as S3Client;
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

  public async createBucket(bucketName: string, options: Options = {}): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    const error = validateName(bucketName);
    if (error !== null) {
      return { value: null, error };
    }

    try {
      const input: CreateBucketCommandInput = {
        Bucket: bucketName,
        ...options,
      };
      const command = new CreateBucketCommand(input);
      const response = await this._client.send(command);
      // console.log(response.Location, response.Location.indexOf(bucketName));
      /*
      console.log(response);
      // not sure if this is necessary
      if (response.$metadata.httpStatusCode === 200) {
        return { value: "ok", error: null };
      } else {
        return {
          value: null,
          error: `Error http status code ${response.$metadata.httpStatusCode}`,
        };
      }
      */
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }
}
