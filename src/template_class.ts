import fs from "fs";
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
// Use ConfigTemplate as starting point for your own configuration object
import { StorageType, ConfigTemplate } from "./types";
import { parseUrl } from "./util";

export class AdapterTemplate extends AbstractAdapter {
  // Your storage type, add this type to the enum StorageType in ./types.ts
  protected type: string;

  // You could use this to store the names of existing buckets to save calls
  // to the cloud storage for checking if a bucket exists.
  private bucketNames: string[];

  // The instance of the storage if you use another library as a wrapper
  // around the API of your storage service, e.g. aws-sdk for Amazon S3.
  private storage: any;

  // The constructor can take both a string and an object. You should define an interface
  // for the object that extends IConfig, see the file ./types.ts. You can use any name
  // for your interface but it is convenient if you start your name with Config and then
  // the name of your storage service in camelcase, e.g. ConfigMyStorageType.
  constructor(config: string | ConfigTemplate) {
    super();
    this.config = this.parseConfig(config);
    if (typeof this.config.bucketName !== "undefined") {
      const msg = this.validateName(this.config.bucketName);
      if (msg !== null) {
        throw new Error(msg);
      }
      this.bucketName = this.config.bucketName;
    }
    // If you are using a wrapper library, create an instance here
    // this.storage = new WrapperLibrary(cfg);
  }

  // This method parses the configuration URL to a configuration object, you can
  // add validation here if required. Note that the type part in the url must match
  // the value of the type key in the object and that this value should also be added
  // to the StorageType enum, e.g.:
  //
  // object: {
  //    type: 'yourtype',
  //    someKey: 'foo',
  //    someOtherKey: 'bar'
  //  }
  //
  // URL: yourtype://foo:bar
  //
  // StorageType {
  //  ...
  //  YOUR_TYPE: 'yourtype'
  // }
  //
  private parseConfig(config: string | ConfigTemplate): ConfigTemplate {
    // Make sure this method return a new object, not the modified config
    // object that is passed as argument
    let cfg: ConfigTemplate;
    if (typeof config === "string") {
      // The parseUrl function is defined in ./util.js, see the documentation
      // in that file or hover your mouse over the function name if you IDE
      // supports it.
      const {
        type,
        part1: someKey,
        part2: someOtherKey,
        bucketName,
        queryString,
      } = parseUrl(config);
      cfg = {
        type,
        someKey,
        someOtherKey,
        bucketName,
        ...queryString,
      };
    } else {
      // don't forget to clone!
      cfg = { ...config };
    }
    if (!cfg.someKey || !cfg.someOtherKey) {
      throw new Error(
        "You must specify a value for both 'someKey' and  'someOtherKey' for storage type 'yourtype'"
      );
    }
    return cfg;
  }

  public async init(): Promise<boolean> {
    if (this.initialized) {
      return Promise.resolve(true);
    }
    // perform some extra initialization steps if required, such as logging in.
    this.initialized = true;
    return true;
  }

  // Implement your own testing code to overrule the `test()` method of the super
  // class AbstractAdapter, or remove this method if you want to use the test method
  // of the super class
  public async test(): Promise<string> {
    return "ok";
  }

  async getFileAsReadable(
    fileName: string,
    options: { start?: number; end?: number } = { start: 0 }
  ): Promise<Readable> {
    // Return a Readable that you've created somehow or that you pipe from your storage.
    const r: Readable = fs.createReadStream("path");
    return r;
  }

  async removeFile(fileName: string): Promise<string> {
    return "file removed";
  }

  // Returns the name of the bucket, so it should actually be named
  // getSelectedBucketName.
  public getSelectedBucket(): string {
    return this.bucketName;
  }

  // In the super class AbstractStorage there are 3 API methods connected to `store()`:
  // this is done to avoid duplicating code because these methods have a lot in common.
  // The API methods are:
  // 1. addFileFromPath
  // 2. addFileFromBuffer
  // 3. addFileFromReadable
  protected async store(buffer: Buffer, targetPath: string, options: object): Promise<void>;
  protected async store(stream: Readable, targetPath: string, options: object): Promise<void>;
  protected async store(origPath: string, targetPath: string, options: object): Promise<void>;
  protected async store(
    arg: string | Buffer | Readable,
    targetPath: string,
    options: object
  ): Promise<void> {
    // Always check if a bucket has been selected before bucket actions.
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }
  }

  // Not a mandatory method, it is used in `createBucket` to check if the
  // bucket already exists. To avoid making too much calls to the cloud
  // storage you could save the names of the buckets that you've already
  // checked so you don't need to check their existence again.
  private checkBucket(name: string): boolean {
    return this.bucketNames.findIndex((n) => n === name) !== -1;
  }

  async createBucket(name: string): Promise<string> {
    // You can use the validateName method of AbstractStorage to check for
    // invalid entries or write your own code to do it.
    // The function validateName is defined in ./util.js
    const msg = this.validateName(name);
    if (msg !== null) {
      return Promise.reject(msg);
    }

    if (this.checkBucket(name)) {
      return Promise.resolve("bucket exists");
    }

    // Create bucket, if bucket has been created successfully you could
    // add it to this.bucketNames so you don't have to check its existence
    // again.
    return Promise.resolve("bucket created");
  }

  async selectBucket(name: string): Promise<string> {
    // If you provide the name of the currently selected bucket, it will
    // be deselected
    if (name === this.bucketName) {
      return "bucket deselected";
    }
    // After you have successfully selected a new bucket, you should
    // update the value of this.bucketName accordingly.
    this.bucketName = name;
    return "bucket selected";
  }

  async clearBucket(name?: string): Promise<string> {
    // If no name has been provided the currently selected bucket will be cleared.
    const n = name || this.bucketName;

    return "bucket cleared";
  }

  async deleteBucket(name?: string): Promise<string> {
    // If no name has been provided the currently selected bucket will be deleted.
    const n = name || this.bucketName;

    if (!n) {
      throw new Error("bucket not found");
    }

    // After the bucket has been deleted you should check if you have deleted
    // the currently selected bucket and if so, reset this.bucketName to avoid
    // that the storage is set to use a non-existing bucket.
    if (n === this.bucketName) {
      this.bucketName = "";
    }

    // And you should remove the name from your saved bucket names.
    this.bucketNames = this.bucketNames.filter((bn) => bn !== n);
    return "bucket deleted";
  }

  // Returns the names of all existing buckets, should actually be named listBucketNames
  async listBuckets(): Promise<string[]> {
    return [];
  }

  async listFiles(numFiles: number = 1000): Promise<[string, number][]> {
    // Always check if a bucket has been selected before bucket actions
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }
    return [];
  }

  async sizeOf(name: string): Promise<number> {
    // Always check if a bucket has been selected before bucket actions
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }
    return 42;
  }

  async fileExists(name: string): Promise<boolean> {
    return true;
  }
}
