import fs from "fs";
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
import {
  BlobGenerateSasUrlOptions,
  BlobSASPermissions,
  BlobServiceClient,
  ContainerCreateOptions,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { ConfigAzureStorageBlob, AdapterConfig, StorageType } from "./types";
import { parseUrl } from "./util";
import { CreateReadStreamOptions } from "@google-cloud/storage";

export class AdapterAzureStorageBlob extends AbstractAdapter {
  protected type = StorageType.AZURE;
  private storage: BlobServiceClient;
  private bucketNames: string[] = [];
  private sharedKeyCredential: StorageSharedKeyCredential;

  constructor(config: string | ConfigAzureStorageBlob) {
    super();
    this.config = this.parseConfig(config as ConfigAzureStorageBlob);
    // console.log(this.config);

    if (typeof this.config.bucketName !== "undefined" && this.config.bucketName !== "") {
      const msg = this.validateName(this.config.bucketName);
      if (msg !== null) {
        throw new Error(msg);
      }
      this.bucketName = this.config.bucketName;
    }
    this.sharedKeyCredential = new StorageSharedKeyCredential(
      (this.config as ConfigAzureStorageBlob).storageAccount,
      (this.config as ConfigAzureStorageBlob).accessKey
    );
    this.storage = new BlobServiceClient(
      `https://${(this.config as ConfigAzureStorageBlob).storageAccount}.blob.core.windows.net`,
      this.sharedKeyCredential
    );
  }

  private parseConfig(config: string | ConfigAzureStorageBlob): ConfigAzureStorageBlob {
    let cfg: ConfigAzureStorageBlob;
    if (typeof config === "string") {
      const {
        type,
        part1: storageAccount,
        part2: accessKey,
        bucketName,
        queryString,
      } = parseUrl(config);
      cfg = {
        type,
        storageAccount,
        accessKey,
        bucketName,
        ...queryString,
      };
    } else {
      cfg = { ...config };
    }

    if (cfg.skipCheck === true) {
      return cfg;
    }

    if (!cfg.storageAccount) {
      throw new Error(
        "You must specify a value for 'storageAccount' for storage type 'azurestorageblob'"
      );
    }
    if (!cfg.accessKey) {
      throw new Error(
        "You must specify a value for 'accessKey' for storage type 'azurestorageblob'"
      );
    }
    return cfg;
  }

  async init(): Promise<boolean> {
    if (this.initialized) {
      return Promise.resolve(true);
    }
    if (typeof this.config.bucketName !== "undefined" && this.config.bucketName !== "") {
      const msg = this.validateName(this.config.bucketName);
      if (msg !== null) {
        throw new Error(msg);
      }
      await this.createBucket(this.config.bucketName).then(() => {
        this.bucketName = this.config.bucketName;
        this.bucketNames.push(this.bucketName);
      });
    }
    // no further initialization required
    this.initialized = true;
    return Promise.resolve(true);
  }

  async getFileAsReadable(
    fileName: string,
    options: CreateReadStreamOptions = { start: 0 }
  ): Promise<Readable> {
    const file = this.storage.getContainerClient(this.bucketName).getBlobClient(fileName);
    const exists = await file.exists();
    if (!exists) {
      throw new Error(`File ${fileName} could not be retrieved from bucket ${this.bucketName}`);
    }
    if (options.end !== undefined) {
      options.end = options.end + 1;
    }
    return (await file.download(options.start, options.end)).readableStreamBody as Readable;
  }

  async getFileAsURL(fileName: string): Promise<string> {
    const file = this.storage.getContainerClient(this.bucketName).getBlobClient(fileName);

    const exists = await file.exists();

    if (!exists) {
      throw new Error(`File ${fileName} could not be retrieved from bucket ${this.bucketName}`);
    }

    const options: BlobGenerateSasUrlOptions = {
      permissions: BlobSASPermissions.parse("r"),
      expiresOn: new Date(new Date().valueOf() + 86400),
    };

    return file.generateSasUrl(options);
  }

  async selectBucket(name: string | null): Promise<string> {
    if (name === null) {
      this.bucketName = "";
      return `bucket '${name}' deselected`;
    }

    return await this.createBucket(name)
      .then(() => {
        this.bucketName = name;
        return `bucket '${name}' selected`;
      })
      .catch((e) => {
        throw e;
      });
  }

  async createBucket(name: string, options?: object): Promise<string> {
    const msg = this.validateName(name);
    if (msg !== null) {
      return Promise.reject(msg);
    }
    if (this.bucketNames.findIndex((b) => b === name) !== -1) {
      return "bucket already exists";
    }
    try {
      const cont = this.storage.getContainerClient(name);
      const exists = await cont.exists();
      if (exists) {
        return "container already exists";
      }
    } catch (e) {
      // console.log(e);
      return `error creating container ${e.message}`;
    }
    try {
      const res = await this.storage.createContainer(name);
      this.bucketNames.push(res.containerClient.containerName);
      return "container created";
    } catch (e) {
      // console.log("error creating container: ", e);
      return `error creating container ${e.message}`;
    }
  }

  async clearBucket(name?: string): Promise<string> {
    const n = name || this.bucketName;
    if (!n) {
      return Promise.reject("no bucket selected");
    }

    try {
      // const containerClient = this.storage.getContainerClient(n);
      // const blobs = containerClient.listBlobsFlat();
      // for await (const blob of blobs) {
      //   console.log(blob.name);
      //   await containerClient.deleteBlob(blob.name);
      // }
      const containerClient = this.storage.getContainerClient(n);
      const blobs = containerClient.listBlobsByHierarchy("/");
      for await (const blob of blobs) {
        if (blob.kind === "prefix") {
          // console.log("prefix", blob);
        } else {
          await containerClient.deleteBlob(blob.name);
        }
      }
      return "bucket cleared";
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async deleteBucket(name?: string): Promise<string> {
    const n = name || this.bucketName;
    if (!n) {
      return Promise.reject("no bucket selected");
    }

    try {
      await this.clearBucket(n);
      const del = await this.storage.deleteContainer(n);
      //console.log('deleting container: ', del);
      if (n === this.bucketName) {
        this.bucketName = "";
      }
      this.bucketNames = this.bucketNames.filter((b) => b !== n);
      return "bucket deleted";
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async listBuckets(): Promise<string[]> {
    this.bucketNames = [];
    // let i = 0;
    for await (const container of this.storage.listContainers()) {
      // console.log(`${i++} ${container.name}`);
      this.bucketNames.push(container.name);
    }
    return this.bucketNames;
  }

  async listFiles(): Promise<[string, number][]> {
    if (!this.bucketName) {
      return Promise.reject("no bucket selected");
    }
    const files: [string, number][] = [];
    const data = this.storage.getContainerClient(this.bucketName).listBlobsFlat();
    for await (const blob of data) {
      if (blob.properties["ResourceType"] !== "directory") {
        files.push([blob.name, blob.properties.contentLength]);
      }
    }

    return files;
  }

  removeFile(fileName: string): Promise<string> {
    try {
      const container = this.storage.getContainerClient(this.bucketName);
      const file = container.getBlobClient(fileName).deleteIfExists();
      /*if(file.()) {
                file.delete();
                return Promise.resolve("file deleted");  
            } else {
                return Promise.resolve("file does not exist");
            }*/
      return Promise.resolve("file deleted");
    } catch (e) {
      console.log("error deleting file: ", e);

      return Promise.resolve(e);
    }
  }

  async sizeOf(name: string): Promise<number> {
    if (!this.bucketName) {
      return Promise.reject("no bucket selected");
    }

    try {
      const blob = this.storage.getContainerClient(this.bucketName).getBlobClient(name);
      return Promise.resolve((await blob.getProperties()).contentLength);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async fileExists(name: string): Promise<boolean> {
    if (!this.bucketName) {
      return Promise.reject("no bucket selected");
    }
    const data = await this.storage
      .getContainerClient(this.bucketName)
      .getBlobClient(name)
      .exists();
    return data;
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
    await this.createBucket(this.bucketName);

    let readStream: Readable;
    if (typeof arg === "string") {
      await fs.promises.stat(arg); // throws error if path doesn't exist
      readStream = fs.createReadStream(arg);
    } else if (arg instanceof Buffer) {
      readStream = new Readable();
      readStream._read = (): void => {}; // _read is required but you can noop it
      readStream.push(arg);
      readStream.push(null);
    } else if (arg instanceof Readable) {
      readStream = arg;
    }
    const file = this.storage
      .getContainerClient(this.bucketName)
      .getBlobClient(targetPath)
      .getBlockBlobClient();
    const writeStream = await file.uploadStream(readStream, 64000, 20, {
      onProgress: (ev) => null,
    });

    return new Promise((resolve, reject) => {
      if (writeStream.errorCode) {
        reject(writeStream.errorCode);
      } else {
        resolve("file stored");
      }
    });
  }
}
