import fs from "fs";
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
import {
  AnonymousCredential,
  BlobGenerateSasUrlOptions,
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import {
  StorageType,
  ResultObjectStream,
  ResultObject,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectBoolean,
  FileBufferParams,
  FilePathParams,
  FileStreamParams,
  AdapterConfigAzure,
  Options,
} from "./types";

export class AdapterAzureStorageBlob extends AbstractAdapter {
  protected _type = StorageType.AZURE;
  protected _config: AdapterConfigAzure;
  protected _configError: string | null = null;
  protected _client: BlobServiceClient;
  private sharedKeyCredential: StorageSharedKeyCredential;

  constructor(config?: string | AdapterConfigAzure) {
    super(config);
    if (this._configError === null) {
      if (
        typeof this.config.accountName === "undefined" &&
        typeof this.config.connectionString === "undefined"
      ) {
        this._configError =
          '[configError] Please provide at least a value for "accountName" or for "connectionString';
        return;
      }
      // option 1: accountKey
      if (typeof this.config.accountKey !== "undefined") {
        try {
          this.sharedKeyCredential = new StorageSharedKeyCredential(
            this.config.accountName as string,
            this.config.accountKey as string
          );
        } catch (e) {
          this._configError = `[configError] ${JSON.parse(e.message).code}`;
        }
        this._client = new BlobServiceClient(
          `https://${this.config.accountName as string}.blob.core.windows.net`,
          this.sharedKeyCredential,
          this.config.options as object
        );
        // option 2: sasToken
      } else if (typeof this.config.sasToken !== "undefined") {
        this._client = new BlobServiceClient(
          `https://${this.config.accountName}.blob.core.windows.net?${this.config.sasToken}`,
          new AnonymousCredential(),
          this.config.options as object
        );
        // option 3: connection string
      } else if (typeof this.config.connectionString !== "undefined") {
        this._client = BlobServiceClient.fromConnectionString(this.config.connectionString);
        // option 4: password less
      } else {
        console.log("default");
        this._client = new BlobServiceClient(
          `https://${this.config.accountName as string}.blob.core.windows.net`,
          new DefaultAzureCredential(),
          this.config.options as object
        );
      }
    }
  }

  get config(): AdapterConfigAzure {
    return this._config as AdapterConfigAzure;
  }

  get storage(): BlobServiceClient {
    return this._client as BlobServiceClient;
  }

  public async getFileAsStream(
    bucketName: string,
    fileName: string,
    options: Options = { start: 0 }
  ): Promise<ResultObjectStream> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const file = this.storage.getContainerClient(bucketName).getBlobClient(fileName);
      const exists = await file.exists();
      if (!exists) {
        return {
          value: null,
          error: `File ${fileName} could not be found in bucket ${bucketName}`,
        };
      }
      const offset = options.start;
      let count = options.end;
      if (typeof count !== "undefined") {
        count = count - offset;
      }
      delete options.start;
      delete options.end;

      try {
        const stream = await file.download(offset, count, options);
        return { value: stream.readableStreamBody as Readable, error: null };
      } catch (e) {
        return { value: null, error: e.message };
      }
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const file = this.storage.getContainerClient(bucketName).getBlobClient(fileName);
      const exists = await file.exists();

      if (!exists) {
        return {
          value: null,
          error: `File ${fileName} could not be found in bucket ${bucketName}`,
        };
      }

      try {
        const options: BlobGenerateSasUrlOptions = {
          permissions: BlobSASPermissions.parse("r"),
          expiresOn: new Date(new Date().valueOf() + 86400),
        };
        const url = await file.generateSasUrl(options);
        return { value: url, error: null };
      } catch (e) {
        return { value: null, error: e.message };
      }
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async createBucket(name: string, options?: object): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const res = await this.storage.createContainer(name, options);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async clearBucket(name: string): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      // const containerClient = this.storage.getContainerClient(name);
      // const blobs = containerClient.listBlobsFlat();
      // for await (const blob of blobs) {
      //   console.log(blob.name);
      //   await containerClient.deleteBlob(blob.name);
      // }
      const containerClient = this.storage.getContainerClient(name);
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

  public async deleteBucket(name: string): Promise<ResultObject> {
    try {
      await this.clearBucket(name);
      const del = await this.storage.deleteContainer(name);
      //console.log('deleting container: ', del);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async listBuckets(): Promise<ResultObjectBuckets> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }
    // let i = 0;
    try {
      const bucketNames = [];
      // let i = 0;
      for await (const container of this.storage.listContainers()) {
        // console.log(`${i++} ${container.name}`);
        bucketNames.push(container.name);
      }
      return { value: bucketNames, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async listFiles(bucketName: string): Promise<ResultObjectFiles> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const files: [string, number][] = [];
      const data = this.storage.getContainerClient(bucketName).listBlobsFlat();
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

  public async removeFile(bucketName: string, fileName: string): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const container = this.storage.getContainerClient(bucketName);
      const file = await container.getBlobClient(fileName).deleteIfExists();
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const blob = this.storage.getContainerClient(bucketName).getBlobClient(fileName);
      const length = (await blob.getProperties()).contentLength;
      return { value: length, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async bucketExists(name: string): Promise<ResultObjectBoolean> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const cont = this.storage.getContainerClient(name);
      const exists = await cont.exists();
      return { value: exists, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const exists = await this.storage
        .getContainerClient(bucketName)
        .getBlobClient(fileName)
        .exists();
      return { value: exists, error: null };
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
      const file = this.storage
        .getContainerClient(params.bucketName)
        .getBlobClient(params.targetPath)
        .getBlockBlobClient();
      const writeStream = await file.uploadStream(readStream, 64000, 20, options);
      if (writeStream.errorCode) {
        return { value: null, error: writeStream.errorCode };
      } else {
        return this.getFileAsURL(params.bucketName, params.targetPath);
      }
    } catch (e) {
      return { value: null, error: e.message };
    }
  }
}
