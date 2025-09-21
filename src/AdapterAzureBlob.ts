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
import { parseUrl } from "./util";

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
    }

    if (!this.config.accountName && !this.config.connectionString) {
      this._configError =
        '[configError] Please provide at least a value for "accountName" or for "connectionString';
      return;
    }
    if (typeof this.config.accountKey !== "undefined") {
      // option 1: accountName + accountKey
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
          this.getBlobEndpoint(),
          this.sharedKeyCredential,
          this.config.options as object
        );
      } catch (e) {
        this._configError = `[configError] ${e.message}`;
      }
    } else if (typeof this.config.sasToken !== "undefined") {
      // option 2: accountName + sasToken
      try {
        this._client = new BlobServiceClient(
          `${this.getBlobEndpoint()}?${this.config.sasToken}`,
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
      // option 4: passwordless / Microsoft Entra
      // see: https://learn.microsoft.com/en-us/azure/developer/javascript/sdk/authentication/local-development-environment-developer-account?tabs=azure-portal%2Csign-in-azure-powershell
      try {
        this._client = new BlobServiceClient(
          this.getBlobEndpoint(),
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

  private getBlobEndpoint(): string {
    let endpoint = "";
    let protocol = "";
    if (typeof this.config.blobDomain !== "undefined") {
      let blobDomain = this.config.blobDomain;
      if (blobDomain.indexOf("http") === 0) {
        protocol = blobDomain.substring(0, blobDomain.indexOf("://") + 3);
      }
      blobDomain = blobDomain.replace(/^(https?:\/\/)/i, '');
      // for local testing with Azurite
      if (blobDomain.indexOf("127.0.0.1") === 0 || blobDomain.indexOf("localhost") === 0) {
        endpoint = `${protocol === "" ? "http://" : protocol}${blobDomain}/${this.config.accountName}`;
      } else {
        endpoint = `${protocol === "" ? "https://" : protocol}${this.config.accountName}.${blobDomain}`;
      }
    } else {
      endpoint = `https://${this.config.accountName}.blob.core.windows.net`
    }
    console.log(endpoint);
    return endpoint;
  }

  // protected, called by methods of public API via AbstractAdapter

  protected async _listBuckets(): Promise<ResultObjectBuckets> {
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

  protected async _createBucket(name: string, options: Options): Promise<ResultObject> {
    try {
      if (options.public === true && typeof options.access === "undefined") {
        options.access = "blob";
      }
      const res = await this._client.createContainer(name, options);
      // const containerClient = this._client.getContainerClient(name);
      // await containerClient.create();
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

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

  protected async _getPublicURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    try {
      if (options.noCheck !== true) {
        const result = await this._bucketIsPublic(bucketName);
        if (result.error !== null) {
          return { value: null, error: result.error };
        } else if (result.value === false) {
          return { value: null, error: `Bucket "${bucketName}" is not public!` };
        }
      }
      const file = this._client.getContainerClient(bucketName).getBlobClient(fileName);
      const exists = await file.exists();
      if (!exists) {
        return {
          value: null,
          error: `File ${fileName} could not be found in bucket ${bucketName}`,
        };
      }
      return { value: file.url, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _getSignedURL(
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
      const exp = new Date();
      if (typeof options.expiresIn !== "number") {
        exp.setUTCDate(exp.getUTCDate() + 7);
      } else {
        exp.setSeconds(exp.getSeconds() + options.expiresIn);
      }
      // console.log(exp)
      const sasOptions: BlobGenerateSasUrlOptions = {
        permissions: options.permissions || BlobSASPermissions.parse("r"),
        expiresOn: exp,
      };
      const url = await file.generateSasUrl(sasOptions);
      return { value: url, error: null };
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
        readStream._read = (): void => { }; // _read is required but you can noop it
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
        return { value: "ok", error: "null" };
      }
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _removeFile(
    bucketName: string,
    fileName: string,
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

  protected async _bucketIsPublic(bucketName: string): Promise<ResultObjectBoolean> {
    try {
      const containerClient = this._client.getContainerClient(bucketName);
      const response = await containerClient.getAccessPolicy();
      const accessLevel = response.blobPublicAccess; // "container", "blob", or undefined/null ("none")
      const value = accessLevel === "container" || accessLevel === "blob";
      return { value, error: null };
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
      const exists = await this._client.getContainerClient(bucketName).getBlobClient(fileName).exists();
      return { value: exists, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
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
}
