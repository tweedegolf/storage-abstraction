import fs from "fs";
import os from "os";
import path from "path";
import to from "await-to-js";
import glob from "glob";
import rimraf from "rimraf";
import slugify from "slugify";
import { Readable } from "stream";
import { IStorage, ConfigLocal, StorageConfig, StorageType } from "./types";
import { AbstractStorage } from "./AbstractStorage";

export class StorageLocal extends AbstractStorage implements IStorage {
  protected type = StorageType.LOCAL as string;
  private directory: string;

  constructor(config: StorageConfig) {
    super(config);
    this.config = config as ConfigLocal;
    this.directory = this.config.directory;
    this.bucketName = this.config.bucketName;
    const exists = fs.existsSync(this.directory);
    if (!exists) {
      fs.mkdirSync(this.directory);
    }
  }

  private async createDestination(targetPath: string): Promise<string> {
    if (this.bucketName === null) {
      throw new Error("Please select a bucket first");
    }
    const storagePath = path.join(this.directory, this.bucketName);
    // const dest = path.join(storagePath, ...targetPath.split('/'));
    const dest = path.join(storagePath, targetPath);
    try {
      await this.createBucket(this.bucketName);
      await fs.promises.stat(path.dirname(dest));
    } catch (e) {
      const [error] = await to(fs.promises.mkdir(path.dirname(dest), { recursive: true }));
      if (error !== null) {
        throw error;
      }
      return dest;
    }
    return dest;
  }

  protected async store(buffer: Buffer, targetPath: string): Promise<void>;
  protected async store(stream: Readable, targetPath: string): Promise<void>;
  protected async store(filePath: string, targetPath: string): Promise<void>;
  protected async store(arg: string | Buffer | Readable, targetPath: string): Promise<void> {
    const dest = await this.createDestination(targetPath);
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
    if (name === null) {
      throw new Error("Can not use `null` as bucket name");
    }
    const bn = slugify(name);
    if (super.checkBucket(bn)) {
      return;
    }
    // try {
    const storagePath = path.join(this.directory, bn);
    return fs.promises
      .stat(storagePath)
      .then(() => true)
      .catch(() => fs.promises.mkdir(storagePath, { recursive: true, mode: 0o777 }))
      .then(() => {
        this.buckets.push(bn);
      });
    // } catch (e) {
    //   throw new Error(`StorageLocal.ts line 89: ${e.message}`);
    // }
  }

  async clearBucket(name?: string): Promise<void> {
    let bn = name || this.bucketName;
    bn = slugify(bn);
    if (!bn) {
      return;
    }
    const storagePath = path.join(this.directory, bn);
    return new Promise(resolve => {
      rimraf(storagePath, e => {
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
    const storagePath = path.join(this.directory, bn);
    return new Promise(resolve => {
      rimraf(storagePath, e => {
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
}
