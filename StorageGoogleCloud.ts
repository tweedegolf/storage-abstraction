import fs from 'fs';
import path from 'path';
// import axios from 'axios';
import { Readable } from 'stream';
import { Storage as GoogleCloudStorage } from '@google-cloud/storage';
import { Storage } from './Storage'
import { IStorage, ConfigGoogleCloud } from '.';

export class StorageGoogleCloud extends Storage implements IStorage {
  private storage: GoogleCloudStorage
  protected bucketName: string

  constructor(config: ConfigGoogleCloud) {
    super(config);
    const {
      projectId,
      keyFilename,
    } = config;
    this.storage = new GoogleCloudStorage({
      projectId,
      keyFilename,
    });
  }

  async getFileAsReadable(fileName: string): Promise<Readable> {
    const file = this.storage.bucket(this.bucketName).file(fileName)
    const [exists] = await file.exists()
    if (exists === false) {
      console.log('file not found');
      throw new Error('file not found')
    } else {
      return file.createReadStream();
    }
  }

  async downloadFile(fileName: string, downloadPath: string): Promise<boolean> {
    const file = this.storage.bucket(this.bucketName).file(fileName)
    const [exists] = await file.exists()
    if (exists === false) {
      console.error(`${fileName} does not exist`)
      return false
    }
    const localFilename = path.join(downloadPath, fileName);
    return file.download({
      destination: localFilename,
    })
      .then(() => true)
      .catch(err => {
        console.log(err.message);
        throw new Error(err.message)
      });
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
    try {
      await this.storage.bucket(this.bucketName).file(fileName).delete()
      return true;
    } catch (e) {
      if (e.message.indexOf('No such object') !== -1) {
        return true;
      }
      console.log(e.message);
      throw new Error(e.message)
    }
  }

  // util members

  protected async store(origPath: string, targetPath: string): Promise<boolean> {
    try {
      await this.createBucket()
      const readStream = fs.createReadStream(origPath);
      const writeStream = this.storage.bucket(this.bucketName).file(targetPath).createWriteStream();
      return new Promise((resolve, reject) => {
        readStream.on('end', () => {
          resolve();
        });
        readStream.on('error', (e: Error) => {
          reject(e);
        });
        readStream.pipe(writeStream);
        writeStream.on('error', (e) => {
          reject(e);
        })
      })
    } catch (e) {
      console.log(e.message);
      throw e
    }
  }

  async createBucket(): Promise<boolean> {
    if (this.bucketCreated === true) {
      return true;
    }
    try {
      await this.storage.createBucket(this.bucketName)
      this.bucketCreated = true
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

  async clearBucket(): Promise<boolean> {
    try {
      await this.storage.bucket(this.bucketName).deleteFiles({ force: true })
      return true;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  private async getMetaData(result: Array<[string, number?]>) {
    for (let i = 0; i < result.length; i++) {
      const file = this.storage.bucket(this.bucketName).file(result[i][0])
      const [metadata] = await file.getMetadata();
      // console.log(metadata.size);
      result[i].push(parseInt(metadata.size, 10));
    }
    return result;
  }

  async listFiles(numFiles: number = 1000): Promise<Array<[string, number?]>> {
    return this.storage.bucket(this.bucketName).getFiles()
      .then(async (data) => {
        const result: Array<[string, number?]> = data[0].map(f => [f.name]);
        await this.getMetaData(result);
        return result as [string, number][];
      })
      .catch(err => {
        console.log(err.message);
        throw new Error(err.message)
      });
  }
}

