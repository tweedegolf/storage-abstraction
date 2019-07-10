import fs from 'fs';
import to from 'await-to-js';
import path from 'path';
import glob from 'glob';
import rimraf, { Options } from 'rimraf';
import slugify from 'slugify';
import { Readable } from 'stream';
import { IStorage, ConfigLocal } from './types';
import { AbstractStorage } from './AbstractStorage';

export class StorageLocal extends AbstractStorage implements IStorage {
  protected bucketName: string;
  private directory: string;
  private storagePath: string;

  constructor(config: ConfigLocal) {
    super(config);
    const {
      directory,
    } = config;
    if (!directory) {
      throw new Error('provide a directory!');
    }
    this.directory = directory;
  }

  private async createDestination(targetPath: string): Promise<string> {
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

  protected async store(buffer: Buffer, targetPath: string): Promise<boolean>;
  protected async store(filePath: string, targetPath: string): Promise<boolean>;
  protected async store(arg: string | Buffer, targetPath: string): Promise<boolean> {
    const dest = await this.createDestination(targetPath);
    if (typeof arg === 'string') {
      try {
        await fs.promises.copyFile(arg, dest);
        return true;
      } catch (e) {
        throw e;
      }
    } else if (arg instanceof Buffer) {
      const writeStream = fs.createWriteStream(dest);
      const readStream = new Readable();
      readStream._read = () => { }; // _read is required but you can noop it
      readStream.push(arg);
      readStream.push(null); // close stream

      return new Promise((resolve, reject) => {
        readStream.on('end', resolve);
        readStream.on('error', reject);
        readStream.pipe(writeStream);
        writeStream.on('error', reject);
      });
    }
    return false;
  }

  async createBucket(name: string): Promise<boolean> {
    const bn = slugify(name);
    if (super.checkBucket(bn)) {
      return true;
    }
    const storagePath = path.join(this.directory, bn);
    return fs.promises.stat(storagePath)
      .then(() => true)
      .catch(() => fs.promises.mkdir(storagePath, { recursive: true, mode: 0o777 }))
      .then(() => {
        this.buckets.push(bn);
        return true;
      });
  }

  async clearBucket(name?: string): Promise<boolean> {
    const bn = name || this.bucketName;
    if (!bn) {
      return true;
    }
    const storagePath = path.join(this.directory, bn);
    return new Promise<boolean>((resolve, reject) => {
      glob(`${storagePath}/**/*`, {}, async (err, files) => {
        if (err !== null) {
          reject(err);
        } else {
          const promises = files.map((f) => {
            return fs.promises.unlink(f);
          });
          await Promise.all(promises);
          resolve(true);
        }
      });
    });
  }

  async deleteBucket(name?: string): Promise<boolean> {
    const bn = name || this.bucketName;
    if (!bn) {
      return true;
    }
    const storagePath = path.join(this.directory, bn);
    return new Promise((resolve) => {
      rimraf(storagePath, (e) => {
        if (e !== null) {
          throw e;
        }
        resolve(true);
      });
    });
  }

  async selectBucket(name: string): Promise<boolean> {
    try {
      this.createBucket(name);
      this.bucketName = name;
      return true;
    } catch (e) {
      throw e;
    }
  }

  async listBuckets(): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(this.directory);
      const stats = await Promise.all(files.map(f => fs.promises.stat(path.join(this.directory, f))));
      const folders = files.filter((f, i) => stats[i].isDirectory());
      // console.log(files);
      return folders;
    } catch (e) {
      throw e;
    }
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
    const storagePath = path.join(this.directory, this.bucketName);
    const files = await this.globFiles(storagePath);
    const result: [string, number][] = [];
    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      const stat = await fs.promises.stat(f);
      // result.push([path.basename(f), stat.size])
      result.push([f.replace(`${storagePath}/`, ''), stat.size]);
    }
    return result;
  }

  async getFileAsReadable(name: string): Promise<Readable> {
    const storagePath = path.join(this.directory, this.bucketName);
    const p = path.join(storagePath, name);
    await fs.promises.stat(p);
    return fs.createReadStream(p);
  }

  async removeFile(fileName: string): Promise<boolean> {
    const storagePath = path.join(this.directory, this.bucketName);
    const p = path.join(storagePath, fileName);
    const [err] = await to(fs.promises.unlink(p));
    if (err !== null) {
      // don't throw an error if the file has already been removed (or didn't exist at all)
      if (err.message.indexOf('no such file or directory') !== -1) {
        return true;
      }
      throw new Error(err.message);
    } else {
      return true;
    }
  }
}
