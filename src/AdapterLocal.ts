import fs from "fs";
import path from "path";
import { glob } from "glob";
import { rimraf } from "rimraf";
import { Readable } from "stream";
import {
  StorageType,
  ConfigLocal,
  ResultObjectBoolean,
  FileBufferParams,
  FilePathParams,
  FileStreamParams,
  ResultObject,
  ResultObjectBuckets,
  ResultObjectFiles,
} from "./types";
import { AbstractAdapter } from "./AbstractAdapter";
import { parseQuerystring, parseMode, parseUrl, validateName } from "./util";

export class AdapterLocal extends AbstractAdapter {
  protected _type = StorageType.LOCAL;
  protected _config: ConfigLocal;
  private mode: number = 0o777;
  private configError: string | null = null;

  constructor(config: ConfigLocal) {
    super();
    this._config = this.parseConfig(config);
    const directory = this._config.directory;
  }

  private parseConfig(config: string | ConfigLocal): ConfigLocal | null {
    let cfg: ConfigLocal;
    if (typeof config === "string") {
      const { value, error } = parseUrl(config);
      if (error) {
        this.configError = error;
        return null;
      }

      const { type, part1: directory, bucketName, queryString: options } = value;

      if (typeof options.mode !== "undefined") {
        const { value, error } = parseMode(options.mode);
        if (error !== null) {
          this.configError = error;
          return null;
        } else {
          this.mode = value;
        }
      }

      cfg = {
        type,
        directory,
        bucketName,
        mode: this.mode,
        ...options,
      };
    } else {
      cfg = { ...config };

      if (!cfg.directory) {
        this.configError = "You must specify a value for 'directory' for storage type 'local'";
        return null;
      }
    }
    if (cfg.skipCheck === true) {
      return cfg;
    }

    return cfg;
  }

  /**
   * @param path
   * creates a directory if it doesn't exist
   */
  private async createDirectory(path: string): Promise<ResultObjectBoolean> {
    try {
      await fs.promises.access(path, this.mode);
      return { value: true, error: null }; // directory exists already
    } catch (e) {
      try {
        await fs.promises.mkdir(path, {
          recursive: true,
          mode: this._config.mode,
        });
        // const m = (await fs.promises.stat(path)).mode;
        // console.log(m, this.options.mode);
        return { value: true, error: null };
      } catch (e) {
        return { value: null, error: e.message };
      }
    }
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

  // Public API

  public async addFile(
    params: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    let { options } = params;
    if (typeof options !== "object") {
      options = {};
    }

    const dest = path.join(this._config.directory, params.bucketName, params.targetPath);

    const { error } = await this.createDirectory(path.dirname(dest));
    if (error !== null) {
      return { value: null, error };
    }

    try {
      let readStream: Readable;
      if (typeof (params as FilePathParams).origPath === "string") {
        await fs.promises.copyFile((params as FilePathParams).origPath, dest);
      } else if (typeof (params as FileBufferParams).buffer !== "undefined") {
        readStream = new Readable();
        readStream._read = (): void => {}; // _read is required but you can noop it
        readStream.push((params as FileBufferParams).buffer);
        readStream.push(null);
      } else if (typeof (params as FileStreamParams).stream !== "undefined") {
        readStream = (params as FileStreamParams).stream;
      }

      const writeStream = fs.createWriteStream(dest);
      return new Promise((resolve, reject) => {
        readStream
          .pipe(writeStream)
          .on("error", (e) => {
            return { value: null, error: e.message };
          })
          .on("finish", () => {
            return { value: dest, error: null };
          });
        writeStream.on("error", reject);
      });
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  async createBucket(name: string): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    const msg = validateName(name);
    if (msg !== null) {
      return { value: null, error: msg };
    }
    try {
      const p = path.join(this._config.directory, name);
      const created = await this.createDirectory(p);
      if (created) {
        return { value: "ok", error: null };
      } else {
        return { value: null, error: `Could not create bucket ${p}` };
      }
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  async clearBucket(name: string): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      // remove all files and folders inside bucket directory, but not the directory itself
      const p = path.join(this._config.directory, name, "*");
      await rimraf(p);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  async deleteBucket(name: string): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const p = path.join(this._config.directory, name);
      await rimraf(p);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  async listBuckets(): Promise<ResultObjectBuckets> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const files = await fs.promises.readdir(this._config.directory);
      // const stats = await Promise.all(
      //   files.map((f) => fs.promises.stat(path.join(this._config.directory, f)))
      // );
      return { value: files, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  async listFiles(): Promise<ResultObjectFiles> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
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
