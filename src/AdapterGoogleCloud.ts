import { Readable } from "stream";
import { GetSignedUrlConfig, Storage as GoogleCloudStorage } from "@google-cloud/storage";
import { AbstractAdapter } from "./AbstractAdapter";
import { Options, StreamOptions, Provider } from "./types/general";
import { FileBufferParams, FileStreamParams } from "./types/add_file_params";
import {
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectObject,
  ResultObjectStream,
} from "./types/result";
import { AdapterConfigGoogleCloud } from "./types/adapter_google_cloud";
import { getErrorMessage, parseUrl } from "./util";

export class AdapterGoogleCloud extends AbstractAdapter {
  protected _provider = Provider.GCS;
  declare protected _config: AdapterConfigGoogleCloud;
  declare protected _client: GoogleCloudStorage;
  protected _configError: string | null = null;

  constructor(config: string | AdapterConfigGoogleCloud) {
    super(config);
    if (typeof config !== "string") {
      this._config = { ...config };
    } else {
      const { value, error } = parseUrl(config);
      if (value === null) {
        this._configError = `[configError] ${error}`;
      } else {
        const { protocol: type, username: accessKeyId, host: bucketName, searchParams } = value;
        if (searchParams !== null) {
          this._config = { type, ...searchParams };
        } else {
          this._config = { type };
        }
        if (accessKeyId !== null) {
          this._config.accessKeyId = accessKeyId;
        }
        if (bucketName !== null) {
          this._config.bucketName = bucketName;
        }
      }
    }

    try {
      this._client = new GoogleCloudStorage(this._config as object);
    } catch (e) {
      this._configError = `[configError] ${getErrorMessage(e)}`;
    }

    if (typeof this.config.bucketName !== "undefined") {
      this._bucketName = this.config.bucketName;
    }
  }

  // protected, called by methods of public API via AbstractAdapter

  protected async _listBuckets(): Promise<ResultObjectBuckets> {
    try {
      const [buckets] = await this._client.getBuckets();
      return { value: buckets.map((b) => b.name), error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _createBucket(name: string, options: Options): Promise<ResultObject> {
    try {
      const bucket = this._client.bucket(name, options);
      const [exists] = await bucket.exists();
      if (exists) {
        return { value: null, error: "bucket exists" };
      }
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }

    try {
      await this._client.createBucket(name, options);
      if (options.public === true) {
        await this._client.bucket(name, options).makePublic();
      }
      // if (options.versioning === true) {
      //   await this._client.bucket(name).setMetadata({
      //     versioning: {
      //       enabled: true,
      //     },
      //   });
      // }
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _getPublicURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    try {
      if (options.noCheck !== true) {
        const { value, error } = await this._bucketIsPublic(bucketName);
        if (error !== null) {
          return { value: null, error };
        } else if (value === false) {
          return { value: null, error: `Bucket "${bucketName}" is not public!` };
        }
      }

      const bucket = this._client.bucket(bucketName, options);
      const file = bucket.file(fileName);
      return { value: file.publicUrl(), error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _getSignedURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    const exp = new Date();
    if (typeof options.expiresIn !== "number") {
      exp.setUTCDate(exp.getUTCDate() + 7);
    } else {
      exp.setSeconds(exp.getSeconds() + options.expiresIn);
    }
    const expires = exp.valueOf();
    try {
      const file = this._client.bucket(bucketName).file(decodeURI(fileName));
      const url = (
        await file.getSignedUrl({
          action: "read",
          expires,
        })
      )[0];
      return { value: url, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _getFileAsStream(
    bucketName: string,
    fileName: string,
    options: StreamOptions
  ): Promise<ResultObjectStream> {
    try {
      const file = this._client.bucket(bucketName).file(fileName);
      return { value: file.createReadStream(options as object), error: null };
    } catch (e) {
      return {
        value: null,
        error: getErrorMessage(e),
      };
    }
  }

  protected async _removeFile(bucketName: string, fileName: string): Promise<ResultObject> {
    try {
      const file = this._client.bucket(bucketName).file(fileName);
      await this._client.bucket(bucketName).file(fileName).delete();
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _bucketIsPublic(bucketName: string): Promise<ResultObjectBoolean> {
    try {
      const bucket = this._client.bucket(bucketName);
      const [policy] = await bucket.iam.getPolicy({ requestedPolicyVersion: 3 });
      let isPublic = false;
      for (let i = 0; i < policy.bindings.length; i++) {
        const element = policy.bindings[i];
        if (
          element.role === "roles/storage.legacyBucketReader" &&
          element.members.includes("allUsers")
        ) {
          isPublic = true;
          break;
        }
      }
      return { value: isPublic, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _addFile(params: FileBufferParams | FileStreamParams): Promise<ResultObject> {
    try {
      let readStream: Readable;
      if (typeof (params as FileBufferParams).buffer !== "undefined") {
        readStream = new Readable();
        readStream._read = (): void => { }; // _read is required but you can noop it
        readStream.push((params as FileBufferParams).buffer);
        readStream.push(null);
      } else if (typeof (params as FileStreamParams).stream !== "undefined") {
        readStream = (params as FileStreamParams).stream;
      }

      const file = this._client
        .bucket(params.bucketName as string)
        .file(params.targetPath, params.options);
      const writeStream = file.createWriteStream(params.options);
      return new Promise((resolve) => {
        readStream
          .pipe(writeStream)
          .on("error", (e: Error) => {
            resolve({ value: null, error: getErrorMessage(e) });
          })
          .on("finish", async () => {
            resolve({ value: "ok", error: null });
          });
        writeStream.on("error", (e: Error) => {
          resolve({ value: null, error: getErrorMessage(e) });
        });
      });
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _listFiles(bucketName: string, numFiles: number): Promise<ResultObjectFiles> {
    try {
      const data = await this._client.bucket(bucketName).getFiles();
      let files: Array<[string, number]> = data[0].map((f) => [
        f.name,
        parseInt(f.metadata.size as string, 10),
      ]);
      if (typeof numFiles === "number") {
        files = files.slice(0, numFiles);
      }
      return {
        value: files,
        error: null,
      };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    try {
      const file = this._client.bucket(bucketName).file(fileName);
      const [metadata] = await file.getMetadata();
      return { value: parseInt(metadata.size as string, 10), error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _bucketExists(name: string): Promise<ResultObjectBoolean> {
    try {
      const data = await this._client.bucket(name).exists();
      return { value: data[0], error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    try {
      const data = await this._client.bucket(bucketName).file(fileName).exists();
      // console.log(data);
      return { value: data[0], error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _deleteBucket(name: string): Promise<ResultObject> {
    try {
      await this._client.bucket(name).delete();
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _clearBucket(name: string): Promise<ResultObject> {
    try {
      await this._client.bucket(name).deleteFiles({ force: true });
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _getPresignedUploadURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObjectObject> {
    try {
      let expires = new Date();
      let offset = 5 * 60;
      if (typeof options.expiresIn !== "undefined") {
        offset = Number.parseInt(options.expiresIn, 10);
      }
      expires.setSeconds(expires.getSeconds() + offset);

      let version: "v2" | "v4" = "v4";
      if (typeof options.version !== "undefined") {
        version = options.version;
      }
      if (version !== "v2" && version !== "v4") {
        return {
          value: null,
          error: `${version} is not valid: version must be either 'v2' or 'v4'`,
        };
      }

      let action: "write" | "read" | "delete" | "resumable" = "write";
      if (typeof options.action !== "undefined") {
        action = options.version;
      }
      if (
        action !== "write" &&
        action !== "read" &&
        action !== "delete" &&
        action !== "resumable"
      ) {
        return {
          value: null,
          error: `${action} is not valid: version must be either 'write', 'read', 'delete' or 'resumable'`,
        };
      }

      let contentType = "application/octet-stream";
      if (typeof options.contentType !== "undefined") {
        contentType = options.contentType;
      }

      const config: GetSignedUrlConfig = {
        version,
        action,
        expires,
        contentType,
      };
      // console.log("contentType", contentType);
      const [url] = await this._client.bucket(bucketName).file(fileName).getSignedUrl(config);
      return { value: { url }, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  //public

  get config(): AdapterConfigGoogleCloud {
    return this._config as AdapterConfigGoogleCloud;
  }

  getConfig(): AdapterConfigGoogleCloud {
    return this._config as AdapterConfigGoogleCloud;
  }

  get serviceClient(): GoogleCloudStorage {
    return this._client as GoogleCloudStorage;
  }

  getServiceClient(): GoogleCloudStorage {
    return this._client as GoogleCloudStorage;
  }
}
