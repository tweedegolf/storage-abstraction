import fs from "fs";
import path from "path";
import { glob } from "glob";
import { rimraf } from "rimraf";
import { Readable } from "stream";
import { Options, StreamOptions, StorageType } from "./types/general";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params";
import {
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectStream,
  ResultObjectStringArray,
} from "./types/result";
import { AdapterConfigLocal } from "./types/adapter_local";
import { AbstractAdapter } from "./AbstractAdapter";
import { parseMode, parseUrl, validateName } from "./util";

export class AdapterLocal extends AbstractAdapter {
  protected _type = StorageType.LOCAL;
  protected _config: AdapterConfigLocal;
  protected _configError: string | null = null;

  constructor(config: AdapterConfigLocal) {
    super(config);
    if (typeof config !== "string") {
      this._config = { ...config };
    } else {
      const { value, error } = parseUrl(config);
      if (error !== null) {
        this._configError = `[configError] ${error}`;
      } else {
        const { protocol: type, username: directory, host: bucketName, searchParams } = value;
        if (searchParams !== null) {
          this._config = { type, directory, ...searchParams };
        } else {
          this._config = { type, directory };
        }
        if (bucketName !== null) {
          this._config.bucketName = bucketName;
        }
      }
      // console.log(this._config);
    }

    if (typeof this._config.mode !== "undefined") {
      const { value, error } = parseMode(this._config.mode);
      if (error !== null) {
        this._configError = `[configError] ${error}`;
      } else {
        this._config.mode = value;
      }
    } else {
      this._config.mode = 0o777;
    }
    if (typeof this._config.directory !== "string") {
      this._configError =
        "[configError] You must specify a value for 'directory' for storage type 'local'";
    }
  }

  /**
   * @param path
   * creates a directory if it doesn't exist
   */
  private async createDirectory(path: string): Promise<ResultObjectBoolean> {
    try {
      await fs.promises.access(path, this._config.mode);
      // return { value: false, error: `directory ${path} already exists` };
      return { value: true, error: null };
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

  private async globFiles(
    folder: string,
    pattern: string = "**/*.*"
  ): Promise<ResultObjectStringArray> {
    try {
      const files = await glob(`${folder}/${pattern}`, {});
      return { value: files, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  // protected, called by methods of public API via AbstractAdapter

  protected async _addFile(
    params: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    const dest = path.join(this._config.directory, params.bucketName, params.targetPath);

    const { error } = await this.createDirectory(path.dirname(dest));
    if (error !== null) {
      return { value: null, error };
    }

    try {
      let readStream: Readable;
      if (typeof (params as FilePathParams).origPath === "string") {
        await fs.promises.copyFile((params as FilePathParams).origPath, dest);
        return { value: dest, error: null };
      } else if (typeof (params as FileBufferParams).buffer !== "undefined") {
        readStream = new Readable();
        readStream._read = (): void => {}; // _read is required but you can noop it
        readStream.push((params as FileBufferParams).buffer);
        readStream.push(null);
      } else if (typeof (params as FileStreamParams).stream !== "undefined") {
        readStream = (params as FileStreamParams).stream;
      }
      // console.time();
      const writeStream = fs.createWriteStream(dest, params.options);
      return new Promise((resolve) => {
        readStream
          .pipe(writeStream)
          .on("error", (e) => {
            resolve({ value: null, error: `[readStream error] ${e.message}` });
          })
          .on("finish", () => {
            resolve({ value: dest, error: null });
          });
        writeStream.on("error", (e) => {
          resolve({ value: null, error: `[writeStream error] ${e.message}` });
        });
      });
      // console.timeEnd();
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _clearBucket(name: string): Promise<ResultObject> {
    try {
      // remove all files and folders inside bucket directory, but not the directory itself
      const p = path.join(this._config.directory, name);
      await rimraf(p, { preserveRoot: false });
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _deleteBucket(name: string): Promise<ResultObject> {
    try {
      const p = path.join(this._config.directory, name);
      await rimraf(p);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _listFiles(bucketName: string): Promise<ResultObjectFiles> {
    try {
      const storagePath = path.join(this._config.directory, bucketName);
      const { value: files, error } = await this.globFiles(storagePath);
      if (error !== null) {
        return { value: null, error };
      }
      const result: [string, number][] = [];
      for (let i = 0; i < files.length; i += 1) {
        const f = files[i];
        const stat = await fs.promises.stat(f);
        // result.push([path.basename(f), stat.size])
        result.push([f.replace(`${storagePath}/`, ""), stat.size]);
      }
      return { value: result, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _getFileAsStream(
    bucketName: string,
    fileName: string,
    options: StreamOptions
  ): Promise<ResultObjectStream> {
    try {
      const p = path.join(this._config.directory, bucketName, fileName);
      await fs.promises.access(p);
      const stream = fs.createReadStream(p, options);
      return { value: stream, error: null };
    } catch (e) {
      return { value: null, error: e };
    }
  }

  protected async _getFileAsURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    try {
      const p = path.join(this._config.directory, bucketName, fileName);
      await fs.promises.access(p);
      return { value: p, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _removeFile(
    bucketName: string,
    fileName: string,
    allVersions: boolean
  ): Promise<ResultObject> {
    try {
      const p = path.join(this._config.directory, bucketName, fileName);
      if (!fs.existsSync(p)) {
        return { value: "ok", error: null };
      }
      await fs.promises.unlink(p);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    try {
      const p = path.join(this._config.directory, bucketName, fileName);
      const { size } = await fs.promises.stat(p);
      return { value: size, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _bucketExists(bucketName: string): Promise<ResultObjectBoolean> {
    try {
      const p = path.join(this._config.directory, bucketName);
      // const r = fs.existsSync(p);
      const m = await fs.promises.stat(p);
      return { value: true, error: null };
    } catch (e) {
      // console.log(e);
      // error only means that the directory does not exist
      return { value: false, error: null };
    }
  }

  protected async _fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    try {
      await fs.promises.access(path.join(this._config.directory, bucketName, fileName));
      return { value: true, error: null };
    } catch (e) {
      return { value: false, error: null };
    }
  }

  // public

  get config(): AdapterConfigLocal {
    return this._config;
  }

  getConfig(): AdapterConfigLocal {
    return this.config;
  }

  public async listBuckets(): Promise<ResultObjectBuckets> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    try {
      const dirents = await fs.promises.readdir(this._config.directory, { withFileTypes: true });
      const files = dirents
        .filter((dirent) => dirent.isFile() === false)
        .map((dirent) => dirent.name);
      // const stats = await Promise.all(
      //   files.map((f) => fs.promises.stat(path.join(this._config.directory, f)))
      // );
      return { value: files, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async createBucket(name: string, options?: Options): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }

    const error = validateName(name);
    if (error !== null) {
      return { value: null, error };
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
}
