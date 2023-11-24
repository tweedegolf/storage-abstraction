import fs from "fs";
import path from "path";
import zip from "@ramda/zip";
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

  constructor(config: string | ConfigGoogleCloud) {
    super();
    this._config = this.parseConfig(config);
    if (typeof this._config.bucketName !== "undefined" && this._config.bucketName !== "") {
      const msg = this.validateName(this._config.bucketName);
      if (msg !== null) {
        throw new Error(msg);
      }
      this.bucketName = this._config.bucketName;
    }
    this.storage = new GoogleCloudStorage(this._config as ConfigGoogleCloud);
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
      const {
        type,
        part1: keyFilename,
        part2: projectId,
        bucketName,
        queryString,
      } = parseUrl(config);
      cfg = {
        type,
        keyFilename,
        projectId,
        bucketName,
        ...queryString,
      };
    } else {
      cfg = { ...config };
    }

    if (cfg.skipCheck === true) {
      return cfg;
    }

    // if (!cfg.keyFilename) {
    //   throw new Error("You must specify a value for 'keyFilename' for storage type 'gcs'");
    // }
    if (cfg.projectId === "" && cfg.keyFilename !== "") {
      cfg.projectId = this.getGCSProjectId(cfg.keyFilename);
    }

    return cfg;
  }

  async init(): Promise<boolean> {
    if (this.initialized) {
      return Promise.resolve(true);
    }
    if (this.bucketName) {
      await this.createBucket(this.bucketName);
      this.bucketNames.push(this.bucketName);
    }
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
      await new Promise((res) => {
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

  async getFileAsStream(
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
      await this.storage.bucket(this.bucketName).file(fileName).delete();
      return "file deleted";
    } catch (e) {
      if (e.message.indexOf("No such object") !== -1) {
        return "file deleted";
      }
      // console.log(e.message);
      throw e;
    }
  }

  // util members

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
    const file = this.storage.bucket(this.bucketName).file(targetPath, options);
    const writeStream = file.createWriteStream();
    return new Promise((resolve, reject) => {
      readStream
        .pipe(writeStream)
        .on("error", reject)
        .on("finish", () => {
          resolve(file.publicUrl());
        });
      writeStream.on("error", reject);
    });
  }

  async createBucket(name: string, options: object = {}): Promise<string> {
    const msg = this.validateName(name);
    if (msg !== null) {
      return Promise.reject(msg);
    }

    if (this.bucketNames.findIndex((b) => b === name) !== -1) {
      return "bucket exists";
    }

    try {
      const bucket = this.storage.bucket(name, options);
      const [exists] = await bucket.exists();
      if (exists) {
        return "bucket exists";
      }
    } catch (e) {
      // console.log(e.message);
      // just move on
    }

    try {
      await this.storage.createBucket(name, options);
      this.bucketNames.push(name);
      return "bucket created";
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
    //     return "bucket created";
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
      return `bucket '${name}' deselected`;
    }

    // const [error] = await to(this.createBucket(name));
    // if (error !== null) {
    //   throw error;
    // }
    return await this.createBucket(name)
      .then(() => {
        this.bucketName = name;
        return `bucket '${name}' selected`;
      })
      .catch((e) => {
        throw e;
      });
  }

  async clearBucket(name?: string): Promise<string> {
    let n = name;
    if (typeof n === "undefined" || n === null || n === "") {
      n = this.bucketName;
    }
    await this.storage.bucket(n).deleteFiles({ force: true });
    return "bucket cleared";
  }

  async deleteBucket(name?: string): Promise<string> {
    const n = name || this.bucketName;
    await this.clearBucket(n);
    const data = await this.storage.bucket(n).delete();
    // console.log(data);
    if (n === this.bucketName) {
      this.bucketName = "";
    }
    this.bucketNames = this.bucketNames.filter((b) => b !== n);
    // console.log(this.bucketName, this.bucketNames);
    return "bucket deleted";
  }

  async listBuckets(): Promise<string[]> {
    const [buckets] = await this.storage.getBuckets();
    this.bucketNames = buckets.map((b) => b.metadata.id);
    return this.bucketNames;
  }

  private async getMetaData(files: string[]): Promise<number[]> {
    const sizes: number[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = this.storage.bucket(this.bucketName).file(files[i]);
      const [metadata] = await file.getMetadata();
      // console.log(metadata);
      sizes.push(parseInt(metadata.size as string, 10));
    }
    return sizes;
  }

  async listFiles(numFiles: number = 1000): Promise<[string, number][]> {
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }
    const data = await this.storage.bucket(this.bucketName).getFiles();
    const names = data[0].map((f) => f.name);
    const sizes = await this.getMetaData(names);
    return zip(names, sizes) as [string, number][];
  }

  async sizeOf(name: string): Promise<number> {
    if (!this.bucketName) {
      throw new Error("no bucket selected");
    }
    const file = this.storage.bucket(this.bucketName).file(name);
    const [metadata] = await file.getMetadata();
    return parseInt(metadata.size as string, 10);
  }

  async fileExists(name: string): Promise<boolean> {
    const data = await this.storage.bucket(this.bucketName).file(name).exists();

    // console.log(data);
    return data[0];
  }
}
