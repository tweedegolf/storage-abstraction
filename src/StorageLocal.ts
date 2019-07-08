import fs from 'fs';
import path from 'path';
import glob from 'glob';
import to from 'await-to-js';
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
    this.storagePath = path.join(this.directory, this.bucketName);
    // console.log(config, this.bucketName);
  }

  private async createDestination(targetPath: string): Promise<string> {
    const dest = path.join(this.storagePath, ...targetPath.split('/'));
    // const dest = path.join(this.storagePath, targetPath);
    try {
      await this.createBucket();
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

  protected async store(filePath: string, targetPath: string): Promise<boolean> {
    const dest = await this.createDestination(targetPath);
    await fs.promises.copyFile(filePath, dest);
    return true;
  }

  protected async storeBuffer(buffer: Buffer, targetPath: string): Promise<boolean> {
    const dest = await this.createDestination(targetPath);

    const readStream = new Readable();
    readStream._read = () => { }; // _read is required but you can noop it
    readStream.push(buffer);
    readStream.push(null); // close stream

    const writeStream = fs.createWriteStream(dest);

    return new Promise((resolve, reject) => {
      readStream.on('end', resolve);
      readStream.on('error', reject);
      readStream.pipe(writeStream);
      writeStream.on('error', reject);
    });
  }

  async createBucket(name?: string): Promise<boolean> {
    super.checkBucket(name);
    if (this.bucketCreated) {
      return true;
    }
    return fs.promises.stat(this.storagePath)
      .then(() => true)
      .catch(() => fs.promises.mkdir(this.storagePath, { recursive: true, mode: 0o777 }))
      .then(() => {
        this.bucketCreated = true;
        return true;
      });
  }

  async clearBucket(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      glob(`${this.storagePath}/**/*`, {}, async (err, files) => {
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

  async deleteBucket(): Promise<boolean> {
    return false;
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
    const files = await this.globFiles(this.storagePath);
    const result: [string, number][] = [];
    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      const stat = await fs.promises.stat(f);
      // result.push([path.basename(f), stat.size])
      result.push([f.replace(`${this.storagePath}/`, ''), stat.size]);
    }
    return result;
  }

  async getFileAsReadable(name: string): Promise<Readable> {
    const p = path.join(this.storagePath, name);
    await fs.promises.stat(p);
    return fs.createReadStream(p);
  }

  async removeFile(fileName: string): Promise<boolean> {
    const p = path.join(this.storagePath, fileName);
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
