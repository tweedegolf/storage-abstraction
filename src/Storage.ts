import path from "path";
import {
  IStorage,
  AdapterConfig,
  FileBufferParams,
  ResultObject,
  FilePathParams,
  FileStreamParams,
  ResultObjectBuckets,
  ResultObjectReadable,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectBoolean,
} from "./types";

//  add new storage adapters here
const adapterClasses = {
  b2: "AdapterBackblazeB2",
  s3: "AdapterAmazonS3",
  gcs: "AdapterGoogleCloudStorage",
  local: "AdapterLocal",
  azure: "AdapterAzureStorageBlob",
  minio: "AdapterMinIO",
};

// or here for functional adapters
const adapterFunctions = {
  b2f: "AdapterBackblazeB2F",
};

const availableAdapters: string = Object.keys(adapterClasses)
  .concat(Object.keys(adapterFunctions))
  .reduce((acc, val) => {
    if (acc.findIndex((v) => v === val) === -1) {
      acc.push(val);
    }
    return acc;
  }, [])
  .sort()
  .join(", ");

export class Storage implements IStorage {
  private adapter: IStorage;

  constructor(config: string | AdapterConfig) {
    this.switchAdapter(config);
  }

  public getType(): string {
    return this.adapter.getType();
  }

  get config(): AdapterConfig {
    return this.adapter.getConfiguration();
  }

  public getConfiguration(): AdapterConfig {
    return this.adapter.getConfiguration();
  }

  public switchAdapter(args: string | AdapterConfig): void {
    // console.log(args);
    let type: string;
    if (typeof args === "string") {
      type = args.substring(0, args.indexOf("://"));
    } else {
      type = args.type;
    }
    // console.log("type", type);
    // console.log("class", adapterClasses[type], "function", adapterFunctions[type]);
    if (!adapterClasses[type] && !adapterFunctions[type]) {
      throw new Error(`unsupported storage type, must be one of ${availableAdapters}`);
    }
    if (adapterClasses[type]) {
      const name = adapterClasses[type];
      const AdapterClass = require(path.join(__dirname, name))[name];
      this.adapter = new AdapterClass(args);
    } else if (adapterFunctions[type]) {
      const name = adapterFunctions[type];
      const module = require(path.join(__dirname, name));
      this.adapter = module.createAdapter(args);
    }
  }

  // all methods below are implementing IStorage

  /**
   * @paramObject FilePath
   * @param {string} FilePath.bucketName
   * @param {string} FilePath.origPath - path to the file that you want to add, e.g. /home/user/Pictures/image1.jpg
   * @param {string} FilePath.targetPath - path on the storage, you can add a path or only provide name of the file
   * @param {object} FilePath.options
   *
   * @paramObject FileBufferParams
   * @param {string} FilePath.bucketName
   * @param {Buffer} FilePath.buffer - buffer
   * @param {string} FilePath.targetPath - path on the storage, you can add a path or only provide name of the file
   * @param {object} FilePath.options
   *
   * @paramObject FileStreamParams
   * @param {string} FilePath.bucketName
   * @param {Readable} FilePath.readable - stream
   * @param {string} FilePath.targetPath - path on the storage, you can add a path or only provide name of the file
   * @param {object} FilePath.options
   *
   * @returns {ResultObject}
   */
  public async addFile(
    paramObject: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    return this.adapter.addFile(paramObject);
  }

  async addFileFromPath(params: FilePathParams): Promise<ResultObject> {
    return this.adapter.addFileFromPath(params);
  }

  async addFileFromBuffer(params: FileBufferParams): Promise<ResultObject> {
    return this.adapter.addFileFromBuffer(params);
  }

  async addFileFromReadable(params: FileStreamParams): Promise<ResultObject> {
    return this.adapter.addFileFromReadable(params);
  }

  async createBucket(name: string, options?: object): Promise<ResultObject> {
    return this.adapter.createBucket(name, options);
  }

  async clearBucket(name: string): Promise<ResultObject> {
    return this.adapter.clearBucket(name);
  }

  async deleteBucket(name: string): Promise<ResultObject> {
    return this.adapter.deleteBucket(name);
  }

  async listBuckets(): Promise<ResultObjectBuckets> {
    return this.adapter.listBuckets();
  }

  async getFileAsReadable(
    bucketName: string,
    fileName: string,
    options: { start?: number; end?: number } = {}
  ): Promise<ResultObjectReadable> {
    const { start = 0, end } = options;
    // console.log(start, end, options);
    return this.adapter.getFileAsReadable(bucketName, fileName, { start, end });
  }

  async getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject> {
    return this.adapter.getFileAsURL(bucketName, fileName);
  }

  async removeFile(
    bucketName: string,
    fileName: string,
    allVersions = false
  ): Promise<ResultObject> {
    return this.adapter.removeFile(bucketName, fileName, allVersions);
  }

  async listFiles(bucketName: string, numFiles?: number): Promise<ResultObjectFiles> {
    return this.adapter.listFiles(bucketName, numFiles);
  }

  async sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    return this.adapter.sizeOf(bucketName, fileName);
  }

  async bucketExists(bucketName: string): Promise<ResultObjectBoolean> {
    return this.adapter.bucketExists(bucketName);
  }

  async fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    return this.adapter.fileExists(bucketName, fileName);
  }
}
