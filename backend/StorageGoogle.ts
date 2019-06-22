import axios from 'axios';
import { Storage as GoogleCloudStorage } from '@google-cloud/storage';
import { Storage } from './Storage'
import fs, { ReadStream } from 'fs';
import path from 'path';
import slugify from 'slugify';
import { StorageConfigGoogle } from './types';
import { stat, unlink } from './utils';
import { Readable } from 'stream';

// export default class StorageGoogle implements Storage {
export default class StorageGoogle extends Storage {
  private storage: GoogleCloudStorage
  protected bucketName: string
  protected bucketExists: boolean = false

  constructor(config: StorageConfigGoogle) {
    super(config);
    const {
      bucketName,
      projectId,
      keyFilename,
    } = config;
    this.storage = new GoogleCloudStorage({
      projectId,
      keyFilename,
    });

    this.bucketName = slugify(bucketName);
  }

  async getFileAsReadable(fileName: string): Promise<Readable | null> {
    const file = this.storage.bucket(this.bucketName).file(fileName)
    if (!file.exists()) {
      return null;
    }
    return file.createReadStream();
  }

  async downloadFile(fileName: string, downloadPath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const file = this.storage.bucket(this.bucketName).file(fileName)
      if (!file) {
        reject(false);
        return;
      }
      console.log(file);
      const localFilename = path.join(downloadPath, fileName);
      const ws = file.createReadStream()
        .on('error', (err) => {
          console.error(err);
        })
        .on('response', (response) => { })
        .on('end', () => { })
        .pipe(fs.createWriteStream(localFilename))

      ws.on('finish', () => {
        resolve(true);
      })
      ws.on('error', () => {
        reject(false);
      })
    })
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

  async removeFile(fileName: string): Promise<boolean> {
    return this.storage.bucket(this.bucketName).file(fileName).delete()
      .then(() => true)
      .catch(e => {
        console.error(e);
        return false;
      });
  }

  // util members

  protected async store(filePath: string, targetFileName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(filePath);
      const writeStream = this.storage.bucket(this.bucketName).file(targetFileName).createWriteStream();
      readStream.on('end', () => {
        resolve(true);
      });
      readStream.on('error', (e: Error) => {
        console.log(e);
        reject(false);
      });
      readStream.pipe(writeStream);
    });
  }

  async createBucket(name: string): Promise<boolean> {
    return this.storage.createBucket(name)
      .then(data => {
        // console.log(data)
        return true;
      })
      .catch(err => {
        // error code 409 is 'You already own this bucket. Please select another name.'
        // so we can safely return true if this error occurs
        return err.code === 409;
      })
  }

  async getFilesInBucket(name: string, numFiles: number = 1000) {
    return this.storage.bucket(name).getFiles()
      .then((data) => [data])
      .catch(err => {
        console.log(err);
        return [];
      });
  }

  async listBucketNames() {
    return this.storage.getBuckets()
      .then(buckets => {
        return buckets[0].map(bucket => bucket.name)
      })
      .catch(err => {
        console.log(err)
        return []
      });
  }

  async listFileNamesInBucket(name: string) {
    const [files] = await this.storage.bucket(name).getFiles();
    return files.map(file => file.name);
  }
}

