import fs from "fs";
import path from "path";
import { glob } from "glob";
import { rimraf } from "rimraf";
import { Readable } from "stream";
import { StorageType, ConfigLocal } from "./types";
import { AbstractAdapter } from "./AbstractAdapter";
import { parseQuerystring, parseMode } from "./util";

export class AdapterLocal extends AbstractAdapter {
  protected type = StorageType.LOCAL;

  constructor(config: ConfigLocal) {
    super();
    this.conf = this.parseConfig(config);
    // console.log(config);
    // console.log(this.config);
    const mode = (this.conf as ConfigLocal).mode;
    if (typeof mode === "undefined") {
      (this.conf as ConfigLocal).mode = 0o777;
    }
    const directory = (this.conf as ConfigLocal).directory;
  }

  private parseConfig(config: string | ConfigLocal): ConfigLocal {
    let cfg: ConfigLocal;
    if (typeof config === "string") {
      const qm = config.indexOf("?");
      const sep = config.indexOf("://");
      const type = config.substring(0, sep);
      // const { mode } = parseQuerystring(config);
      const querystring = parseQuerystring(config);
      const end = qm !== -1 ? qm : config.length;
      const lastSlash = config.lastIndexOf("/");
      // console.log(end, lastSlash);
      let directory = config.substring(sep + 3, end);
      let bucketName: string;
      if (lastSlash !== -1) {
        if (lastSlash > sep + 3) {
          directory = config.substring(sep + 3, lastSlash);
        }
        bucketName = config.substring(lastSlash + 1, end);
      }
      // console.log("DIR", sep, directory, end, lastSlash, qm);
      // console.log("DIR", config, directory, bucketName, lastSlash);
      cfg = {
        type,
        directory,
        bucketName,
        ...querystring,
        // mode: mode as string,
      };
    } else {
      cfg = { ...config };

      if (!cfg.directory) {
        throw new Error("You must specify a value for 'directory' for storage type 'local'");
      }

      // retrieve bucketName from directory
      // if (!cfg.bucketName) {
      //   const lastSlash = cfg.directory.lastIndexOf("/");
      //   if (lastSlash === -1) {
      //     cfg.bucketName = cfg.directory;
      //     cfg.directory = "";
      //   } else {
      //     const dir = cfg.directory;
      //     cfg.directory = dir.substring(0, lastSlash);
      //     cfg.bucketName = dir.substring(lastSlash + 1);
      //   }
      // }

      // if (cfg.directory === "") {
      //   cfg.directory = process.cwd();
      // }
    }
    if (cfg.skipCheck === true) {
      return cfg;
    }

    return cfg;
  }

  async init(): Promise<boolean> {
    if (this.initialized) {
      return Promise.resolve(true);
    }

    if (typeof this.conf.bucketName !== "undefined" && this.conf.bucketName !== "") {
      const { error } = await this.validateName(this.conf.bucketName);
      if (error !== null) {
        Promise.resolve({ error, value: null });
        return;
      }
    }

    if (typeof this.bucketName !== "undefined") {
      await this.createDirectory(path.join(this.directory, this.bucketName));
    }
    this.initialized = true;
    return Promise.resolve(true);
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
          mode: parseMode(this.mode),
        })
        .catch((e) => {
          throw e;
          // console.error(`\x1b[31m${e.message}`);
          // return false;
        });
      // const m = (await fs.promises.stat(path)).mode;
      // console.log(m, this.options.mode);
      return true;
    }
  }

  protected async store(buffer: Buffer, targetPath: string): Promise<string>;
  protected async store(stream: Readable, targetPath: string): Promise<string>;
  protected async store(filePath: string, targetPath: string): Promise<string>;
  protected async store(arg: string | Buffer | Readable, targetPath: string): Promise<string> {
    const dest = path.join(this.directory, this.bucketName, targetPath);
    await this.createDirectory(path.dirname(dest));
    if (typeof arg === "string") {
      await fs.promises.copyFile(arg, dest);
      return dest;
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
        .on("finish", () => {
          resolve(dest);
        });
      writeStream.on("error", reject);
    });
  }

  async createBucket(name: string): Promise<string> {
    const msg = this.validateName(name);
    if (msg !== null) {
      return Promise.reject(msg);
    }
    // console.log(bn, name);
    const created = await this.createDirectory(path.join(this.directory, name));
    if (created) {
      this.buckets.push(name);
      return "ok";
    }
  }

  async clearBucket(name?: string): Promise<string> {
    const n = name || this.bucketName;
    if (!n) {
      return;
    }
    // remove all files and folders inside bucket directory, but not the directory itself
    const p = path.join(this.directory, n, "*");
    return rimraf(p)
      .then(() => {
        return "";
      })
      .catch((e: Error) => {
        throw e;
      });
  }

  async deleteBucket(name?: string): Promise<string> {
    const n = name || this.bucketName;
    if (!n) {
      return Promise.resolve("");
    }
    const p = path.join(this.directory, n);
    return rimraf(p)
      .then(() => {
        if (n === this.bucketName) {
          this.bucketName = "";
        }
        return "";
      })
      .catch((e: Error) => {
        if (n === this.bucketName) {
          this.bucketName = "";
        }
        if (e !== null) {
          return Promise.reject(e);
        }
      });
  }

  async selectBucket(name?: string | null): Promise<string> {
    if (!name) {
      this.bucketName = "";
      return `bucket '${name}' deselected`;
    }
    await this.createBucket(name);
    this.bucketName = name;
    return `bucket '${name}' selected`;
  }

  async listBuckets(): Promise<string[]> {
    // console.log(this.directory);
    const files = await fs.promises.readdir(this.directory);
    const stats = await Promise.all(
      files.map((f) => fs.promises.stat(path.join(this.directory, f)))
    );
    this.buckets = files.filter((_, i) => stats[i].isDirectory());
    return this.buckets;
  }

  private async globFiles(folder: string): Promise<string[]> {
    return glob(`${folder}/**/*.*`, {})
      .then((files) => {
        return Promise.resolve(files);
      })
      .catch((err) => {
        return Promise.reject(err);
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

  async getFileAsStream(
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
      .catch((err) => {
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
