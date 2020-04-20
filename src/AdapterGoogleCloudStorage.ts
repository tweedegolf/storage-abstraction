import fs from "fs";
import path from "path";
import { zip } from "ramda";
import to from "await-to-js";
import { Readable } from "stream";
import {
  Storage as GoogleCloudStorage,
  File,
  CreateReadStreamOptions,
} from "@google-cloud/storage";
import { AbstractAdapter } from "./AbstractAdapter";
import { StorageType, ConfigGoogleCloud } from "./types";
import { parseUrl } from "./util";

export class AdapterGoogleCloudStorage extends AbstractAdapter {
  protected type = StorageType.GCS;
  private bucketNames: string[] = [];
  private storage: GoogleCloudStorage;
  public static defaultOptions = {
    slug: true,
  };

  constructor(config: string | ConfigGoogleCloud) {
    super();
    const cfg = this.parseConfig(config);
    this.config = { ...cfg };
    if (cfg.slug) {
      this.slug = cfg.slug;
      delete cfg.slug;
    }
    if (cfg.bucketName) {
      this.bucketName = this.generateSlug(cfg.bucketName, this.slug);
      delete cfg.bucketName;
    }
    if (this.bucketName) {
      this.bucketNames.push(this.bucketName);
    }
    delete cfg.type;
    this.storage = new GoogleCloudStorage(cfg);
  }

  /**
   * @param {string} keyFile - path to the keyFile
   *
   * Read in the keyFile and retrieve the projectId, this is function
   * is called when the user did not provide a projectId
   */
  private getGCSProjectId(keyFile: string): string {
    const data = fs.readFileSync(keyFile).toString("utf-8");
    const json = JSON.parse(data);
    return json.project_id;
  }

  private parseConfig(config: string | ConfigGoogleCloud): ConfigGoogleCloud {
    let cfg: ConfigGoogleCloud;
    if (typeof config === "string") {
      const { type, part1: keyFilename, part2: projectId, bucketName, queryString } = parseUrl(
        config
      );
      cfg = {
        type,
        keyFilename,
        projectId,
        bucketName,
        ...queryString,
      };
    } else {
      cfg = config;
    }
    if (!cfg.keyFilename) {
      throw new Error("You must specify a value for 'keyFilename' for storage type 'gcs'");
    }
    if (!cfg.projectId) {
      cfg.projectId = this.getGCSProjectId(cfg.keyFilename);
    }
    return cfg;
  }

  async init(): Promise<boolean> {
    // no further initialization required
    this.initialized = true;
    return Promise.resolve(true);
  }

  // After uploading a file to Google Storage it may take a while before the file
  // can be discovered and downloaded; this function adds a little delay
  async getFile(fileName: string, retries: number = 5): Promise<File> {
    const file = this.storage.bucket(this.bucketName).file(fileName);
    const [exists] = await file.exists();
    if (!exists && retries !== 0) {
      const r = retries - 1;
      await new Promise(res => {
        setTimeout(res, 250);
      });
      // console.log('RETRY', r, fileName);
      return this.getFile(fileName, r);
    }
    if (!exists) {
      throw new Error(`File ${fileName} could not be retrieved from bucket ${this.bucketName}`);
    }
    return file;
  }

  async getFileAsReadable(
    fileName: string,
    options: CreateReadStreamOptions = { start: 0 }
  ): Promise<Readable> {
    const file = this.storage.bucket(this.bucketName).file(fileName);
    const [exists] = await file.exists();
    if (exists) {
      return file.createReadStream(options);
    }
    throw new Error(`File ${fileName} could not be retrieved from bucket ${this.bucketName}`);
  }

  // not in use
  async downloadFile(fileName: string, downloadPath: string): Promise<void> {
    const file = this.storage.bucket(this.bucketName).file(fileName);
    const localFilename = path.join(downloadPath, fileName);
    await file.download({ destination: localFilename });
  }

  async removeFile(fileName: string): Promise<string> {
    try {
      await this.storage
        .bucket(this.bucketName)
        .file(fileName)
        .delete();
    } catch (e) {
      if (e.message.indexOf("No such object") !== -1) {
        return;
      }
      // console.log(e.message);
      throw e;
    }
  }

  // util members

  protected async store(buffer: Buffer, targetPath: string): Promise<void>;
  protected async store(stream: Readable, targetPath: string): Promise<void>;
  protected async store(origPath: string, targetPath: string): Promise<void>;
  protected async store(arg: string | Buffer | Readable, targetPath: string): Promise<void> {
    if (!this.bucketName) {
      throw new Error("Please select a bucket first");
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
    const writeStream = this.storage
      .bucket(this.bucketName)
      .file(targetPath)
      .createWriteStream();
    return new Promise((resolve, reject) => {
      readStream
        .pipe(writeStream)
        .on("error", reject)
        .on("finish", resolve);
      writeStream.on("error", reject);
    });
  }

  async createBucket(name: string): Promise<string> {
    const msg = this.validateName(name);
    if (msg !== null) {
      return Promise.reject(msg);
    }

    const n = this.generateSlug(name);
    if (this.bucketNames.findIndex(b => b === n) !== -1) {
      return;
    }

    try {
      const bucket = this.storage.bucket(n);
      const [exists] = await bucket.exists();
      if (exists) {
        return;
      }
    } catch (e) {
      // console.log(e.message);
      // just move on
    }

    try {
      await this.storage.createBucket(n);
      this.bucketNames.push(n);
    } catch (e) {
      // console.log("ERROR", e.message, e.code);
      if (
        e.code === 409 &&
        e.message === "You already own this bucket. Please select another name."
      ) {
        // error code 409 can have messages like:
        // "You already own this bucket. Please select another name." (bucket exists!)
        // "Sorry, that name is not available. Please try a different one." (notably bucket name "new-bucket")
        // So in some cases we can safely ignore this error, in some case we can't
        return;
      }
      throw new Error(e.message);
    }

    // ossia:
    // await this.storage
    //   .createBucket(n)
    //   .then(() => {
    //     this.bucketNames.push(n);
    //     return;
    //   })
    //   .catch(e => {
    //     if (e.code === 409) {
    //       // error code 409 is 'You already own this bucket. Please select another name.'
    //       // so we can safely return true if this error occurs
    //       return;
    //     }
    //     throw new Error(e.message);
    //   });
  }

  async selectBucket(name: string | null): Promise<string> {
    if (name === null) {
      this.bucketName = "";
      return;
    }

    const [error] = await to(this.createBucket(name));
    if (error !== null) {
      throw error;
    }
    this.bucketName = name;
  }

  async clearBucket(name?: string): Promise<string> {
    let n = name || this.bucketName;
    n = this.generateSlug(n);
    await this.storage.bucket(n).deleteFiles({ force: true });
    return "ok";
  }

  async deleteBucket(name?: string): Promise<string> {
    let n = name || this.bucketName;
    n = this.generateSlug(n);
    await this.clearBucket(n);
    const data = await this.storage.bucket(n).delete();
    // console.log(data);
    if (n === this.bucketName) {
      this.bucketName = "";
    }
    this.bucketNames = this.bucketNames.filter(b => b !== n);
    return "ok";
  }

  async listBuckets(): Promise<string[]> {
    const [buckets] = await this.storage.getBuckets();
    this.bucketNames = buckets.map(b => b.metadata.id);
    return this.bucketNames;
  }

  private async getMetaData(files: string[]): Promise<number[]> {
    const sizes: number[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = this.storage.bucket(this.bucketName).file(files[i]);
      const [metadata] = await file.getMetadata();
      // console.log(metadata);
      sizes.push(parseInt(metadata.size, 10));
    }
    return sizes;
  }

  async listFiles(numFiles: number = 1000): Promise<[string, number][]> {
    // if (!this.bucketName) {
    //   throw new Error("Please select a bucket first");
    // }
    const data = await this.storage.bucket(this.bucketName).getFiles();
    const names = data[0].map(f => f.name);
    const sizes = await this.getMetaData(names);
    return zip(names, sizes) as [string, number][];
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
    const data = await this.storage
      .bucket(this.bucketName)
      .file(name)
      .exists();

    // console.log(data);
    return data[0];
  }
}
