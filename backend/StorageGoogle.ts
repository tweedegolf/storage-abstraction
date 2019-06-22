import { Storage, File } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import slugify from 'slugify';
import { StorageConfigGoogle } from './types';

// export default class StorageGoogle implements Storage {
export default class StorageGoogle {
  private storage: Storage
  private bucketName: string
  private bucketExists: boolean = false

  constructor(config: StorageConfigGoogle) {
    const {
      bucketName,
      projectId,
      keyFilename,
    } = config;
    this.storage = new Storage({
      projectId,
      keyFilename,
    });

    this.bucketName = bucketName;
  }

  async addFileFromPath(filePath: string): Promise<boolean> {
    if (this.bucketExists === false) {
      this.bucketExists = await this.createBucket(this.bucketName)
    }
    const fileName = path.basename(filePath);

    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(filePath);
      const writeStream = this.storage.bucket(this.bucketName).file(fileName).createWriteStream();
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

  // async addFile(file: Express.Multer.File): Promise<boolean> {
  //   return true;
  // }

  async deleteFile(file: File): Promise<boolean> {
    return true;
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
    const files = await this.storage.bucket(name).getFiles()
      .catch(err => {
        console.log(err);
        return [];
      });
    return [files];
  }

  async listBucketNames() {
    const buckets = await this.storage.getBuckets()
      .catch(err => {
        console.log(err)
        return []
      });
    return buckets[0].map(bucket => bucket.name)
  }

  async listFileNamesInBucket(name: string) {
    const [files] = await this.storage.bucket(name).getFiles();
    return files.map(file => file.name);
  }
}

