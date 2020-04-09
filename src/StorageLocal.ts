import fs from "fs";
import path from "path";
import to from "await-to-js";
import glob from "glob";
import rimraf from "rimraf";
import { Readable } from "stream";
import { ConfigLocal, StorageType } from "./types";
import { AbstractStorage } from "./AbstractStorage";
import { parseUrl, parseIntFromString } from "./util";

export class StorageLocal extends AbstractStorage {
  protected type = StorageType.LOCAL as string;
  // protected bucketName: string;
  private directory: string;
  private buckets: string[] = [];
  public static defaultOptions = {
    mode: 0o777,
    slug: false,
  };

  constructor(config: ConfigLocal) {
    super();
    const { directory, bucketName, options } = this.parseConfig(config);
    if (bucketName) {
      this.bucketName = this.generateSlug(bucketName);
      this.directory = this.generateSlug(directory);
    } else {
      this.bucketName = this.generateSlug(path.basename(directory));
      this.directory = this.generateSlug(path.dirname(directory));
    }
    // console.log(StorageLocal.defaultOptions.mode, options);
    this.options = { ...StorageLocal.defaultOptions, ...options };
    this.options.mode = this.options.mode.toString();
    // in case you've passed in an octal number as string value, e.g. "0o755"
    this.options.mode = parseIntFromString(this.options.mode);
    this.config = {
      type: this.type,
      directory,
      bucketName,
      options,
    };
  }

  async init(): Promise<boolean> {
    await this.createDirectory(path.join(this.directory, this.bucketName));
    this.initialized = true;
    return true;
  }

  private parseConfig(config: string | ConfigLocal): ConfigLocal {
    let cfg: ConfigLocal;
    if (typeof config === "string") {
      const { type, part1: directory, bucketName, options } = parseUrl(config);
      cfg = {
        type,
        directory,
        bucketName,
        options,
      };
      // console.log(cfg);
    } else {
      cfg = config;
    }
    if (!cfg.directory) {
      throw new Error("You must specify a value for 'directory' for storage type 'local'");
    }
    return cfg;
  }

  /**
   * @param path
   * creates a directory if it doesn't exist
   */
  private async createDirectory(path: string): Promise<boolean> {
    try {
      await fs.promises.access(path);
      return true;
    } catch (e) {
      await fs.promises
        .mkdir(path, { recursive: true, mode: this.options.mode as string })
        .catch(e => {
          console.error(`\x1b[31m${e.message}`);
          return false;
        });
      return true;
    }
  }

  protected async store(buffer: Buffer, targetPath: string): Promise<void>;
  protected async store(stream: Readable, targetPath: string): Promise<void>;
  protected async store(filePath: string, targetPath: string): Promise<void>;
  protected async store(arg: string | Buffer | Readable, targetPath: string): Promise<void> {
    const dest = path.join(this.directory, this.bucketName, targetPath);
    await this.createDirectory(path.dirname(dest));
    if (typeof arg === "string") {
      await fs.promises.copyFile(arg, dest);
      return;
    }
    const writeStream = fs.createWriteStream(dest);
    let readStream: Readable = null;
    if (arg instanceof Buffer) {
      readStream = new Readable();
      readStream._read = (): void => {}; // _read is required but you can noop it
      readStream.push(arg);
      readStream.push(null); // close stream
    } else if (arg instanceof Readable) {
      readStream = arg;
    }
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
    const bn = this.generateSlug(name);
    // console.log(bn, name);
    const created = await this.createDirectory(path.join(this.directory, bn));
    if (created) {
      this.buckets.push(bn);
      return "ok";
    }
  }

  async clearBucket(name?: string): Promise<void> {
    let bn = name || this.bucketName;
    // console.log(`clear bucket "${bn}"`);
    // slugify in case an un-slugified name is supplied
    bn = this.generateSlug(bn);
    if (!bn) {
      return;
    }
    // remove all files and folders inside bucket directory, but not the directory itself
    const p = path.join(this.directory, bn, "*");
    return new Promise(resolve => {
      rimraf(p, (e: Error) => {
        if (e) {
          throw e;
        }
        resolve();
      });
    });
  }

  async deleteBucket(name?: string): Promise<void> {
    let bn = name || this.bucketName;
    // slugify in case an un-slugified name is supplied
    bn = this.generateSlug(bn);
    if (!bn) {
      return;
    }
    const p = path.join(this.directory, bn);
    return new Promise(resolve => {
      rimraf(p, e => {
        if (e !== null) {
          throw e;
        }
        if (bn === this.bucketName) {
          this.bucketName = null;
        }
        resolve();
      });
    });
  }

  async selectBucket(name?: string | null): Promise<void> {
    if (!name) {
      this.bucketName = null;
      return;
    }
    await this.createBucket(name);
    this.bucketName = name;
  }

  async listBuckets(): Promise<string[]> {
    const files = await fs.promises.readdir(this.directory);
    const stats = await Promise.all(files.map(f => fs.promises.stat(path.join(this.directory, f))));
    this.buckets = files.filter((_, i) => stats[i].isDirectory());
    return this.buckets;
  }

  private async globFiles(folder: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      glob(`${folder}/**/*.*`, {}, (err, files) => {
        if (err !== null) {
          reject(err);
        } else {
          resolve(files);
        }
      });
    });
  }

  async listFiles(): Promise<[string, number][]> {
    if (!this.bucketName) {
      throw new Error("Please select a bucket first");
    }
    const storagePath = path.join(this.directory, this.bucketName);
    const files = await this.globFiles(storagePath);
    const result: [string, number][] = [];
    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      const stat = await fs.promises.stat(f);
      // result.push([path.basename(f), stat.size])
      result.push([f.replace(`${storagePath}/`, ""), stat.size]);
    }
    return result;
  }

  async getFileAsReadable(
    name: string,
    options: { start?: number; end?: number } = { start: 0 }
  ): Promise<Readable> {
    const p = path.join(this.directory, this.bucketName, name);
    const s = (await fs.promises.stat(p)).size;
    // console.log(p, s, options);
    return fs.createReadStream(p, options);
  }

  async removeFile(fileName: string): Promise<void> {
    const p = path.join(this.directory, this.bucketName, fileName);
    const [err] = await to(fs.promises.unlink(p));
    if (err !== null) {
      // don't throw an error if the file has already been removed (or didn't exist at all)
      if (err.message.indexOf("no such file or directory") !== -1) {
        return;
      }
      throw new Error(err.message);
    }
  }

  async sizeOf(name: string): Promise<number> {
    if (!this.bucketName) {
      throw new Error("Please select a bucket first");
    }
    const p = path.join(this.directory, this.bucketName, name);
    const stat = await fs.promises.stat(p);
    return stat.size;
  }

  async fileExists(name: string): Promise<boolean> {
    try {
      await fs.promises.access(path.join(this.directory, this.bucketName, name));
      return true;
    } catch (e) {
      return false;
    }
  }
}
