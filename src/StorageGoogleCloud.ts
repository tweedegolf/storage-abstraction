import fs from 'fs';
import path from 'path';
import { zip } from 'ramda';
import to from 'await-to-js';
import { Readable } from 'stream';
import { Storage as GoogleCloudStorage, File } from '@google-cloud/storage';
import { AbstractStorage } from './AbstractStorage';
import { IStorage, ConfigGoogleCloud } from './types';
import slugify from 'slugify';

export class StorageGoogleCloud extends AbstractStorage implements IStorage {
  private storage: GoogleCloudStorage;
  protected bucketName: string;

  constructor(config: ConfigGoogleCloud) {
    super(config);
    const {
      projectId,
      keyFilename,
    } = config;
    if (!projectId || !keyFilename) {
      throw new Error('provide both an accessKeyId and a secretAccessKey!');
    }

    this.storage = new GoogleCloudStorage({
      projectId,
      keyFilename,
    });
  }

  // After uploading a file to Google Storage it may take a while before the file
  // can be discovered and downloaded; this function adds a little delay
  async getFile(fileName: string, retries: number = 5): Promise<File> {
    const file = this.storage.bucket(this.bucketName).file(fileName);
    const [exists] = await file.exists();
    if (!exists && retries !== 0) {
      const r = retries - 1;
      await new Promise((res) => {
        setTimeout(res, 250);
      });
      // console.log('RETRY', r, fileName);
      return this.getFile(fileName, r);
    }
    if (!exists) {
      throw new Error(`File ${fileName} could not be retreived from bucket ${this.bucketName}`);
    }
    return file;
  }

  async getFileAsReadable(fileName: string): Promise<Readable> {
    const file = await this.getFile(fileName);
    return file.createReadStream();
  }

  // not in use
  async downloadFile(fileName: string, downloadPath: string): Promise<boolean> {
    const file = await this.storage.bucket(this.bucketName).file(fileName);
    const localFilename = path.join(downloadPath, fileName);
    await file.download({ destination: localFilename });
    return true;
  }

  async removeFile(fileName: string): Promise<boolean> {
    try {
      await this.storage.bucket(this.bucketName).file(fileName).delete();
      return true;
    } catch (e) {
      if (e.message.indexOf('No such object') !== -1) {
        return true;
      }
      // console.log(e.message);
      throw e;
    }
  }

  // util members

  protected async store(buffer: Buffer, targetPath: string): Promise<boolean>;
  protected async store(origPath: string, targetPath: string): Promise<boolean>;
  protected async store(arg: string | Buffer, targetPath: string): Promise<boolean> {
    await this.createBucket(this.bucketName);
    let readStream: Readable;
    if (typeof arg === 'string') {
      readStream = fs.createReadStream(arg);
    } else if (arg instanceof Buffer) {
      readStream._read = () => { }; // _read is required but you can noop it
      readStream.push(arg); readStream.push(null);
      readStream.push(null);
    }
    const writeStream = this.storage.bucket(this.bucketName).file(targetPath).createWriteStream();

    return new Promise((resolve, reject) => {
      readStream.on('end', resolve);
      readStream.on('error', reject);
      readStream.pipe(writeStream);
      writeStream.on('error', reject);
    });
  }

  async createBucket(name: string): Promise<boolean> {
    const n = slugify(name);
    if (super.checkBucket(n)) {
      return true;
    }
    const bucket = this.storage.bucket(n);
    const [exists] = await bucket.exists();
    if (exists) {
      return true;
    }

    try {
      await this.storage.createBucket(n);
      this.buckets.push(n);
      return true;
    } catch (e) {
      if (e.code === 409) {
        // error code 409 is 'You already own this bucket. Please select another name.'
        // so we can safely return true if this error occurs
        return true;
      }
      throw new Error(e.message);
    }
  }

  async selectBucket(name: string): Promise<boolean> {
    const [error] = await to(this.createBucket(name));
    if (error !== null) {
      throw error;
    }
    this.bucketName = name;
    return true;
  }

  async clearBucket(name?: string): Promise<boolean> {
    const n = name || this.bucketName;
    await this.storage.bucket(n).deleteFiles({ force: true });
    return true;
  }

  async deleteBucket(name?: string): Promise<boolean> {
    const n = name || this.bucketName;
    try {
      const data = await this.storage.bucket(n).delete();
      // console.log(data);
      if (n === this.bucketName) {
        this.bucketName = null;
      }
      this.buckets = this.buckets.filter(b => b !== n);
      return true;
    } catch (e) {
      throw e;
    }
  }

  async listBuckets(): Promise<string[]> {
    const [buckets] = await this.storage.getBuckets();
    return buckets.map(b => b.metadata.id);
  }

  private async getMetaData(files: string[]) {
    const sizes: number[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = this.storage.bucket(this.bucketName).file(files[i]);
      const [metadata] = await file.getMetadata();
      // console.log(metadata);
      sizes.push(parseInt(metadata.size, 10));
    }
    return sizes;
  }

  async listFiles(numFiles: number = 1000): Promise<[string, number][]> {
    const data = await this.storage.bucket(this.bucketName).getFiles();
    const names = data[0].map(f => f.name);
    const sizes = await this.getMetaData(names);
    return zip(names, sizes) as [string, number][];
  }

  // async getFile(fileName: string) {
  //   const file = this.storage.bucket(this.bucketName).file(fileName)
  //   file.get().then(async (data) => {
  //     const apiResponse: any = data[1];
  //     const bin = axios.request({
  //       url: apiResponse.selfLink,
  //       headers: {
  //         'x-goog-project-id': '',
  //       }
  //     })
  //       .then(data => console.log(data))
  //       .catch(e => console.error(e));
  //   });
  // }
}
