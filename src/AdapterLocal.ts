import fs from "fs";
import path from "path";
import glob from "glob";
import rimraf from "rimraf";
import { Readable } from "stream";
import { StorageType, ConfigLocal } from "./types";
import { AbstractAdapter } from "./AbstractAdapter";
import { parseQuerystring, parseMode } from "./util";

export class AdapterLocal extends AbstractAdapter {
  protected type = StorageType.LOCAL;
  // protected bucketName: string;
  protected slug = false;
  private directory: string;
  private buckets: string[] = [];
  private mode: number | string = 0o777;

  constructor(config: ConfigLocal) {
    super();
    const { directory, slug, mode } = this.parseConfig(config);
    if (slug) {
      this.slug = slug;
    }
    if (mode) {
      this.mode = mode;
    }

    this.directory = this.generateSlug(path.dirname(directory), this.slug);
    this.bucketName = this.generateSlug(path.basename(directory), this.slug);
    // console.log("INIT", this.directory, this.bucketName);

    this.config = {
      type: this.type,
      directory,
      mode,
      slug,
    };
  }

  private parseConfig(config: string | ConfigLocal): ConfigLocal {
    let cfg: ConfigLocal;
    if (typeof config === "string") {
      const qm = config.indexOf("?");
      const sep = config.indexOf("://");
      const type = config.substring(0, sep);
      const { slug, mode } = parseQuerystring(config);
      const end = qm !== -1 ? qm : config.length;
      const directory = config.substring(sep + 3, end);
      // console.log("DIR", directory, end, qm);
      cfg = {
        type,
        directory,
        slug: slug === "true",
        mode: mode as string,
      };
      // console.log(cfg);
    } else {
      cfg = { ...config };
    }
    if (!cfg.directory) {
      throw new Error("You must specify a value for 'directory' for storage type 'local'");
    }
    return cfg;
  }

  async init(): Promise<boolean> {
    await this.createDirectory(path.join(this.directory, this.bucketName));
    this.initialized = true;
    return true;
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
        .mkdir(path, {
          recursive: true,
          mode: parseMode(this.mode as string | number),
        })
        .catch(e => {
          throw e;
          // console.error(`\x1b[31m${e.message}`);
          // return false;
        });
      // const m = (await fs.promises.stat(path)).mode;
      // console.log(m, this.options.mode);
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
    const bn = this.generateSlug(name, this.slug);
    // console.log(bn, name);
    const created = await this.createDirectory(path.join(this.directory, bn));
    if (created) {
      this.buckets.push(bn);
      return "ok";
    }
  }

  async clearBucket(name?: string): Promise<string> {
    let bn = name || this.bucketName;
    // console.log(`clear bucket "${bn}"`);
    // slugify in case an un-slugified name is supplied
    bn = this.generateSlug(bn, this.slug);
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

  async deleteBucket(name?: string): Promise<string> {
    let bn = name || this.bucketName;
    // slugify in case an un-slugified name is supplied
    bn = this.generateSlug(bn, this.slug);
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
          this.bucketName = "";
        }
        resolve();
      });
    });
  }

  async selectBucket(name?: string | null): Promise<string> {
    if (!name) {
      this.bucketName = "";
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
      throw new Error("no bucket selected");
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

  async removeFile(fileName: string): Promise<string> {
    const p = path.join(this.directory, this.bucketName, fileName);
    return fs.promises
      .unlink(p)
      .then(() => {
        return "";
      })
      .catch(err => {
        // don't throw an error if the file has already been removed (or didn't exist at all)
        if (err.message.indexOf("no such file or directory") !== -1) {
          return "";
        }
        throw new Error(err.message);
      });
  }

  async sizeOf(name: string): Promise<number> {
    if (!this.bucketName) {
      throw new Error("no bucket selected");
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
