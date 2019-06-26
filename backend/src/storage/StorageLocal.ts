import fs from 'fs'
import path from 'path'
import glob from 'glob'
import { Storage as StorageTypes } from './types';
import { Storage } from './Storage';
import { Readable } from 'stream';
import to from 'await-to-js';

export class StorageLocal extends Storage implements StorageTypes.IStorage {
  protected bucketName: string
  private directory: string
  private storagePath: string

  constructor(config: StorageTypes.ConfigLocal) {
    super(config);
    const {
      directory,
    } = config;
    this.directory = directory;
    this.storagePath = path.join(this.directory, this.bucketName);
  }

  protected async store(filePath: string, targetFileName: string): Promise<boolean> {
    // const dest = path.join(this.storagePath, ...targetFileName.split('/'));
    const dest = path.join(this.storagePath, targetFileName);
    try {
      await this.createBucket()
      await fs.promises.stat(path.dirname(dest));
    } catch (e) {
      fs.mkdir(path.dirname(dest), { recursive: true }, e => {
        if (e) {
          throw new Error(e.message)
        }
      });
    }

    return fs.promises.copyFile(filePath, dest)
      .then(() => true)
      .catch(e => {
        throw new Error(e.message);
      })
  }

  async createBucket(): Promise<boolean> {
    if (this.bucketCreated === true) {
      return true;
    }
    return fs.promises.stat(this.storagePath)
      .then(() => true)
      .catch(() => fs.promises.mkdir(this.storagePath, { recursive: true, mode: 0o777 }))
      .then(() => true)
      .catch(e => {
        console.log(e.message);
        throw new Error(e.message);
      })
  }

  async clearBucket(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      glob(`${this.storagePath}/**/*`, {}, (err, files) => {
        if (err !== null) {
          reject(err);
        } else {
          const promises = files.map(f => {
            return fs.promises.unlink(f)
          });
          try {
            Promise.all(promises)
            resolve(true);
          } catch (e) {
            throw e;
          }
        }
      })
    })
  }

  private async globFiles(folder: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      glob(`${folder}/**/*.*`, {}, (err, files) => {
        if (err !== null) {
          reject(err);
        } else {
          resolve(files);
        }
      })
    })
  }

  async listFiles(): Promise<[string, number?][]> {
    try {
      const files = await this.globFiles(this.storagePath);
      const result: [string, number?][] = []
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const stat = await fs.promises.stat(f)
        // result.push([path.basename(f), stat.size])
        result.push([f.replace(`${this.storagePath}/`, ''), stat.size])
      }
      return result;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async getFileAsReadable(name: string): Promise<Readable> {
    const p = path.join(this.storagePath, name);
    try {
      await fs.promises.stat(p);
      return fs.createReadStream(p);
    } catch (e) {
      throw new Error(e.message)
    }
  }

  async removeFile(fileName: string): Promise<boolean> {
    const p = path.join(this.storagePath, fileName);
    const [err] = await to(fs.promises.unlink(p));
    if (err !== null) {
      if (err.message.indexOf('no such file or directory') !== -1) {
        return true;
      }
      console.log(err);
      throw new Error(err.message);
    } else {
      return true;
    }
  }
}

