import {
  AdapterConfig,
  FileBufferParams,
  FilePathParams,
  FileStreamParams,
  IStorage,
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectReadable,
} from "./types";

export abstract class AbstractAdapter implements IStorage {
  // protected type: StorageType;
  protected type: string;
  protected conf: AdapterConfig;

  getType(): string {
    return this.type;
  }

  public get config(): AdapterConfig {
    return this.conf;
  }

  public getConfiguration(): AdapterConfig {
    return this.conf;
  }

  /**
   * @param FilePath
   * @param {string} FilePath.bucketName
   * @param {string} FilePath.origPath - path to the file that you want to add, e.g. /home/user/Pictures/image1.jpg
   * @param {string} FilePath.targetPath - path on the storage, you can add a path or only provide name of the file
   * @param {object} FilePath.options
   */
  async addFileFromPath(params: FilePathParams): Promise<ResultObject> {
    return await this.addFile(params);
  }

  async addFileFromBuffer(params: FileBufferParams): Promise<ResultObject> {
    return await this.addFile(params);
  }

  async addFileFromReadable(params: FileStreamParams): Promise<ResultObject> {
    return await this.addFile(params);
  }

  // stubs

  abstract addFile(param: FilePathParams): Promise<ResultObject>;
  abstract addFile(param: FileBufferParams): Promise<ResultObject>;
  abstract addFile(param: FileStreamParams): Promise<ResultObject>;

  abstract createBucket(name: string, options?: object): Promise<ResultObject>;

  abstract clearBucket(name: string): Promise<ResultObject>;

  abstract deleteBucket(name: string): Promise<ResultObject>;

  abstract listBuckets(): Promise<ResultObjectBuckets>;

  abstract getFileAsReadable(
    bucketName: string,
    fileName: string,
    options?: { start?: number; end?: number }
  ): Promise<ResultObjectReadable>;

  abstract getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject>;

  abstract removeFile(
    bucketName: string,
    fileName: string,
    allVersions?: boolean
  ): Promise<ResultObject>;

  abstract listFiles(bucketName: string): Promise<ResultObjectFiles>;

  abstract sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;

  abstract fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>;

  abstract bucketExists(name: string): Promise<ResultObjectBoolean>;
}
