import fs from "fs";
import path from "path";
import to from "await-to-js";
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
// use ConfigTemplate as starting point for your configuration object
import { StorageType, ConfigTemplate } from "./types";
import { parseUrl } from "./util";

export class AdapterTemplate extends AbstractAdapter {
  // your storage type, this type to the enum StorageType in ./types.ts
  protected type: string;
  private bucketId: string;
  // you could use this to store the names of existing buckets to save calls
  // to the cloud storage for checking if a bucket exists
  private bucketNames: string[];
  // the instance of the storage is you use another library, e.g. aws-sdk for Amazon S3
  private storage: any;
  // add default options to you liking, it is recommended to use slugify for cloud storage
  // so in most cases you should set `slug` to true.
  public static defaultOptions = {
    slug: true,
  };

  constructor(config: string | ConfigTemplate) {
    super();
    const { someKey, someOtherKey, bucketName, options } = this.parseConfig(config);
    this.storage; // if you are using a library, create an instance here
    this.options = { ...AdapterTemplate.defaultOptions, ...options };
    this.bucketName = this.generateSlug(bucketName, this.options);
    this.config = {
      type: this.type,
      someKey,
      someOtherKey,
      options,
    };
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
  // class AbstractAdapter, or remove this method.
  public async test(): Promise<string> {
    return "ok";
  }

  // Here you parse the configuration URL and object, you can add validation
  // here if required. Note that the type part in the url must match the type
  // key in the object and that this value should also be used in the StorageType
  // enum, e.g.:
  // object: {type: 'yourtype', someKey: 'foo', someOtherKey: 'bar'}
  // URL: yourtype://foo:bar
  // StorageType { YOUR_TYPE: 'yourtype'}
  private parseConfig(config: string | ConfigTemplate): ConfigTemplate {
    let cfg: ConfigTemplate;
    if (typeof config === "string") {
      const { type, part1, part2, bucketName, options } = parseUrl(config);
      cfg = {
        type,
        someKey: part1,
        someOtherKey: part2,
        bucketName,
        options,
      };
    } else {
      cfg = config;
    }
    if (!cfg.someKey || !cfg.someOtherKey) {
      throw new Error(
        "You must specify a value for both 'someKey' and  'someOtherKey' for storage type 'yourtype'"
      );
    }
    return cfg;
  }

  async getFileAsReadable(
    fileName: string,
    options: { start?: number; end?: number } = { start: 0 }
  ): Promise<Readable> {
    // Return a Readable that you've created somehow or piped from you storage
    const r: Readable = fs.createReadStream("path");
    return r;
  }

  async removeFile(fileName: string): Promise<void> {}

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
  protected async store(buffer: Buffer, targetPath: string): Promise<void>;
  protected async store(stream: Readable, targetPath: string): Promise<void>;
  protected async store(origPath: string, targetPath: string): Promise<void>;
  protected async store(arg: string | Buffer | Readable, targetPath: string): Promise<void> {
    // always check if a bucket has been selected
    if (!this.bucketName) {
      throw new Error("Please select a bucket first");
    }
  }

  // Not a mandatory method, it is used in `createBucket` to check if the
  // bucket already exists. To avoid making too much calls to the cloud
  // storage you could save the names of the buckets that you've already
  // checked
  private checkBucket(name: string): boolean {
    return this.bucketNames.findIndex(n => n === name) !== -1;
  }

  async createBucket(name: string): Promise<string> {
    // you can use the validateName method of AbstractStorage to check for
    // invalid entries or write your own code to do it.
    const msg = this.validateName(name);
    if (msg !== null) {
      return Promise.reject(msg);
    }

    // you can use the generateSlug method of AbstractStorage to slugify
    // the provided name. note that this method checks the value of `slug`
    // in the options
    const n = this.generateSlug(name);
    if (this.checkBucket(n)) {
      return;
    }

    // create bucket, if bucket has been created successfully you could
    // add it to this.bucketNames
  }

  async selectBucket(name: string): Promise<void> {
    // after you have successfully selected a new bucket, you should
    // update the value of this.bucketName accordingly
    this.bucketName = name;
  }

  async clearBucket(name?: string): Promise<void> {
    // if no name has been provided the currently selected bucket will be cleared
    let n = name || this.bucketName;
    // slugify the name in case the user provide the unslugified version
    n = this.generateSlug(n);
  }

  async deleteBucket(name?: string): Promise<void> {
    // if no name has been provided the currently selected bucket will be deleted
    let n = name || this.bucketName;
    // slugify the name in case the user provide the unslugified version
    n = this.generateSlug(n);
    // after the bucket has been deleted you should check if you have deleted
    // the currently selected bucket and reset this.bucketName if necessary
    // to avoid that the storage is set to use a non-existing bucket
    if (n === this.bucketName) {
      this.bucketName = "";
    }
    // and remove the name from your saved bucket names
    this.bucketNames = this.bucketNames.filter(bn => bn !== n);
  }

  // Returns the names of all existing buckets, should actually be named listBucketNames
  async listBuckets(): Promise<string[]> {
    return [];
  }

  async listFiles(numFiles: number = 1000): Promise<[string, number][]> {
    // always check if a bucket has been selected!
    if (!this.bucketName) {
      throw new Error("Please select a bucket first");
    }
    const {
      data: { files, nextFileName },
    } = await this.storage.listFileNames({
      bucketId: this.bucketId,
    });
    this.files = files;
    this.nextFileName = nextFileName;
    return this.files.map(f => [f.fileName, f.contentLength]);
  }

  async sizeOf(name: string): Promise<number> {
    if (!this.bucketName) {
      throw new Error("Please select a bucket first");
    }
    const file = this.storage.bucket(this.bucketName).file(name);
    const [metadata] = await file.getMetadata();
    return parseInt(metadata.size, 10);
  }

  async fileExists(name: string): Promise<boolean> {
    return true;
  }
}
