import fs from "fs";
import path from "path";
import to from "await-to-js";
import glob from "glob";
import rimraf from "rimraf";
import slugify from "slugify";
import { Readable } from "stream";
import { ConfigLocal, StorageType } from "./types";
import { AbstractStorage } from "./AbstractStorage";
import { parseUrl } from "./util";

export class StorageLocal extends AbstractStorage {
  protected type = StorageType.LOCAL as string;
  // protected bucketName: string;
  private directory: string;
  private fullPath: string;
  private buckets: string[] = [];

  constructor(config: ConfigLocal) {
    super();
    const { directory } = this.parseConfig(config);
    this.bucketName = path.basename(directory);
    this.directory = path.dirname(directory);
    this.fullPath = directory;
  }

  async init(): Promise<boolean> {
    await this.createDirectory(this.fullPath);
    this.initialized = true;
    return true;
  }

  private parseConfig(config: string | ConfigLocal): ConfigLocal {
    let cfg: ConfigLocal;
    if (typeof config === "string") {
      const [type, directory] = parseUrl(config);
      cfg = {
        type,
        directory,
      };
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
    const exists = await fs.promises.stat(path);
    if (!exists) {
      await fs.promises.mkdir(path, { recursive: true, mode: 0o777 }).catch(e => {
        console.error(`\x1b[31m${e.message}`);
        return false;
      });
      return true;
    }
    return true;
  }

  protected async store(buffer: Buffer, targetPath: string): Promise<void>;
  protected async store(stream: Readable, targetPath: string): Promise<void>;
  protected async store(filePath: string, targetPath: string): Promise<void>;
  protected async store(arg: string | Buffer | Readable, targetPath: string): Promise<void> {
    const dest = path.join(this.fullPath, targetPath);
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

  async createBucket(name: string): Promise<void> {
    if (!name === null) {
      throw new Error("Can not use `null` as bucket name");
    }
    const bn = slugify(name);
    const created = await this.createDirectory(path.join(this.directory, bn));
    if (created) {
      this.buckets.push(bn);
    }
  }

  async clearBucket(name?: string): Promise<void> {
    let bn = name || this.bucketName;
    bn = slugify(bn);
    if (!bn) {
      return;
    }
    const p = path.join(this.directory, bn);
    return new Promise(resolve => {
      rimraf(p, e => {
        if (e !== null) {
          throw e;
        }
        resolve();
      });
    });
  }

  async deleteBucket(name?: string): Promise<void> {
    let bn = name || this.bucketName;
    bn = slugify(bn);
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

  async selectBucket(name: string | null): Promise<void> {
    if (name === null) {
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
    if (this.bucketName === null) {
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
    await fs.promises.stat(p);
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
    if (this.bucketName === null) {
      throw new Error("Please select a bucket first");
    }
    const p = path.join(this.directory, this.bucketName, name);
    const stat = await fs.promises.stat(p);
    return stat.size;
  }

  async fileExists(name: string): Promise<boolean> {
    return true;
  }
}
