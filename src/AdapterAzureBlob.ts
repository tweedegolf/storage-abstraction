import fs from "fs";
import { Readable } from "stream";
import {
  AnonymousCredential,
  BlobGenerateSasUrlOptions,
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
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
import { AdapterConfigAzureBlob } from "./types/adapter_azure_blob";
import { parseUrl, validateName } from "./util";

export class AdapterAzureBlob extends AbstractAdapter {
  protected _type = StorageType.AZURE;
  protected _config: AdapterConfigAzureBlob;
  protected _configError: string | null = null;
  protected _client: BlobServiceClient;
  private sharedKeyCredential: StorageSharedKeyCredential;

  constructor(config: string | AdapterConfigAzureBlob) {
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
          username: accountName,
          password: accountKey,
          host: bucketName,
          searchParams,
        } = value;
        if (searchParams !== null) {
          this._config = { type, ...searchParams };
        } else {
          this._config = { type };
        }
        if (accountName !== null) {
          this._config.accountName = accountName;
        }
        if (accountKey !== null) {
          this._config.accountKey = accountKey;
        }
        if (bucketName !== null) {
          this._config.bucketName = bucketName;
        }
      }
      // console.log(this._config);
    }

    if (!this.config.accountName && !this.config.connectionString) {
      this._configError =
        '[configError] Please provide at least a value for "accountName" or for "connectionString';
      return;
    }
    if (typeof this.config.accountKey !== "undefined") {
      // option 1: accountKey
      try {
        this.sharedKeyCredential = new StorageSharedKeyCredential(
          this.config.accountName as string,
          this.config.accountKey as string
        );
      } catch (e) {
        this._configError = `[configError] ${JSON.parse(e.message).code}`;
      }
      try {
        this._client = new BlobServiceClient(
          `https://${this.config.accountName as string}${this._getBlobDomain()}`,
          this.sharedKeyCredential,
          this.config.options as object
        );
      } catch (e) {
        this._configError = `[configError] ${e.message}`;
      }
    } else if (typeof this.config.sasToken !== "undefined") {
      // option 2: sasToken
      try {
        this._client = new BlobServiceClient(
          `https://${this.config.accountName}${this._getBlobDomain()}?${this.config.sasToken}`,
          new AnonymousCredential(),
          this.config.options as object
        );
      } catch (e) {
        this._configError = `[configError] ${e.message}`;
      }
    } else if (typeof this.config.connectionString !== "undefined") {
      // option 3: connection string
      try {
        this._client = BlobServiceClient.fromConnectionString(this.config.connectionString);
      } catch (e) {
        this._configError = `[configError] ${e.message}`;
      }
    } else {
      // option 4: password less
      try {
        this._client = new BlobServiceClient(
          `https://${this.config.accountName as string}${this._getBlobDomain()}`,
          new DefaultAzureCredential(),
          this.config.options as object
        );
      } catch (e) {
        this._configError = `[configError] ${e.message}`;
      }
    }
    if (typeof this.config.bucketName !== "undefined") {
      this._bucketName = this.config.bucketName;
    }
  }

  // protected, called by methods of public API via AbstractAdapter

  protected async _getFileAsStream(
    bucketName: string,
    fileName: string,
    options: StreamOptions
  ): Promise<ResultObjectStream> {
    try {
      const file = this._client.getContainerClient(bucketName).getBlobClient(fileName);
      const exists = await file.exists();
      if (!exists) {
        return {
          value: null,
          error: `File ${fileName} could not be found in bucket ${bucketName}`,
        };
      }
      const { start, end } = options;
      let offset: number;
      let count: number;
      if (typeof start !== "undefined") {
        offset = start;
      } else {
        offset = 0;
      }
      if (typeof end !== "undefined") {
        count = end - offset + 1;
      }
      delete options.start;
      delete options.end;
      // console.log(offset, count, options);

      try {
        const stream = await file.download(offset, count, options as object);
        return { value: stream.readableStreamBody as Readable, error: null };
      } catch (e) {
        return { value: null, error: e.message };
      }
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _getFileAsURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    try {
      const file = this._client.getContainerClient(bucketName).getBlobClient(fileName);
      const exists = await file.exists();

      if (!exists) {
        return {
          value: null,
          error: `File ${fileName} could not be found in bucket ${bucketName}`,
        };
      }

      try {
        const sasOptions: BlobGenerateSasUrlOptions = {
          permissions: options.permissions || BlobSASPermissions.parse("r"),
          expiresOn: options.expiresOn || new Date(new Date().valueOf() + 86400),
        };
        let url: string;
        if (options.useSignedUrl) {
          url = await file.generateSasUrl(sasOptions);
        } else {
          url = file.url;
        }
        return { value: url, error: null };
      } catch (e) {
        return { value: null, error: e.message };
      }
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _clearBucket(name: string): Promise<ResultObject> {
    try {
      // const containerClient = this._client.getContainerClient(name);
      // const blobs = containerClient.listBlobsFlat();
      // for await (const blob of blobs) {
      //   console.log(blob.name);
      //   await containerClient.deleteBlob(blob.name);
      // }
      const containerClient = this._client.getContainerClient(name);
      const blobs = containerClient.listBlobsByHierarchy("/");
      for await (const blob of blobs) {
        if (blob.kind === "prefix") {
          // console.log("prefix", blob);
        } else {
          await containerClient.deleteBlob(blob.name);
        }
      }
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _deleteBucket(name: string): Promise<ResultObject> {
    try {
      await this.clearBucket(name);
      const del = await this._client.deleteContainer(name);
      //console.log('deleting container: ', del);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _listFiles(bucketName: string, numFiles: number): Promise<ResultObjectFiles> {
    try {
      const files: [string, number][] = [];
      const data = this._client.getContainerClient(bucketName).listBlobsFlat();
      for await (const blob of data) {
        if (blob.properties["ResourceType"] !== "directory") {
          files.push([blob.name, blob.properties.contentLength]);
        }
      }
      return { value: files, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _addFile(
    params: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    try {
      let readStream: Readable;
      if (typeof (params as FilePathParams).origPath === "string") {
        const f = (params as FilePathParams).origPath;
        if (!fs.existsSync(f)) {
          return { value: null, error: `File with given path: ${f}, was not found` };
        }
        readStream = fs.createReadStream(f);
      } else if (typeof (params as FileBufferParams).buffer !== "undefined") {
        readStream = new Readable();
        readStream._read = (): void => {}; // _read is required but you can noop it
        readStream.push((params as FileBufferParams).buffer);
        readStream.push(null);
      } else if (typeof (params as FileStreamParams).stream !== "undefined") {
        readStream = (params as FileStreamParams).stream;
      }
      const file = this._client
        .getContainerClient(params.bucketName)
        .getBlobClient(params.targetPath)
        .getBlockBlobClient();
      const writeStream = await file.uploadStream(readStream, 64000, 20, params.options);
      if (writeStream.errorCode) {
        return { value: null, error: writeStream.errorCode };
      } else {
        return this._getFileAsURL(params.bucketName, params.targetPath, params.options);
      }
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
      const container = this._client.getContainerClient(bucketName);
      const file = await container.getBlobClient(fileName).deleteIfExists();
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    try {
      const blob = this._client.getContainerClient(bucketName).getBlobClient(fileName);
      const length = (await blob.getProperties()).contentLength;
      return { value: length, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _bucketExists(name: string): Promise<ResultObjectBoolean> {
    try {
      const cont = this._client.getContainerClient(name);
      const exists = await cont.exists();
      return { value: exists, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    try {
      const exists = await this._client
        .getContainerClient(bucketName)
        .getBlobClient(fileName)
        .exists();
      return { value: exists, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  private _getBlobDomain(): string {
    let blobDomain = ".blob.core.windows.net";
    if (typeof this.config.blobDomain !== "undefined") {
      blobDomain = this.config.blobDomain;
      if (!blobDomain.startsWith(".")) {
        blobDomain = "." + blobDomain;
      }
    }
    return blobDomain;
  }

  // public

  get config(): AdapterConfigAzureBlob {
    return this._config as AdapterConfigAzureBlob;
  }

  getConfig(): AdapterConfigAzureBlob {
    return this._config as AdapterConfigAzureBlob;
  }

  get serviceClient(): BlobServiceClient {
    return this._client as BlobServiceClient;
  }

  getServiceClient(): BlobServiceClient {
    return this._client as BlobServiceClient;
  }

  public async listBuckets(): Promise<ResultObjectBuckets> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }
    // let i = 0;
    try {
      const bucketNames = [];
      // let i = 0;
      for await (const container of this._client.listContainers()) {
        // console.log(`${i++} ${container.name}`);
        bucketNames.push(container.name);
      }
      return { value: bucketNames, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async createBucket(name: string, options?: Options): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    const error = validateName(name);
    if (error !== null) {
      return { value: null, error };
    }

    try {
      const res = await this._client.createContainer(name, options);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }
}
