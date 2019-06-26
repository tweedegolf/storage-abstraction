import S3 from 'aws-sdk/clients/s3';
import fs from 'fs';
import { Storage } from './Storage';
import { Storage as StorageTypes } from './types';
import { Readable } from 'stream';

export class StorageAmazonS3 extends Storage implements StorageTypes.IStorage {
  private storage: S3;
  protected bucketName: string

  constructor(config: StorageTypes.ConfigAmazonS3) {
    super(config)
    const {
      accessKeyId,
      secretAccessKey,
    } = config;
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('provide both an accessKeyId and a secretAccessKey!');
    }
    this.storage = new S3({
      apiVersion: '2006-03-01',
      accessKeyId,
      secretAccessKey,
    })
  }

  async getFileAsReadable(fileName: string): Promise<Readable> {
    const params = {
      Bucket: this.bucketName,
      Key: fileName
    };
    return this.storage.getObject(params).promise()
      .then(() => this.storage.getObject(params).createReadStream())
      .catch(err => {
        console.log(err.message);
        throw new Error(err.message)
      });
  }

  async removeFile(fileName: string): Promise<boolean> {
    const params = {
      Bucket: this.bucketName,
      Key: fileName
    };
    return this.storage.deleteObject(params).promise()
      .then((data) => {
        // console.log(data)
        return true
      })
      .catch(err => {
        console.log(err.message);
        throw new Error(err.message)
      });
  }


  // util members

  async createBucket(): Promise<boolean> {
    if (this.bucketCreated === true) {
      return true;
    }
    return this.storage.createBucket({ Bucket: this.bucketName }).promise()
      .then(() => true)
      .catch(err => {
        console.log(err.message);
        throw new Error(err.message)
      })
  }

  async clearBucket(): Promise<boolean> {
    try {
      const params1 = {
        Bucket: this.bucketName,
        MaxKeys: 1000,
      };
      const { Contents: content } = await this.storage.listObjects(params1).promise()
      const params2 = {
        Bucket: this.bucketName,
        Delete: {
          Objects: content.map(value => ({ Key: value.Key })),
          Quiet: false,
        },
      }
      await this.storage.deleteObjects(params2).promise()
      return true;
    } catch (e) {
      throw e;
    }
  }

  protected async store(filePath: string, targetFileName: string): Promise<boolean> {
    try {
      await this.createBucket();
      const readStream = fs.createReadStream(filePath);
      const params = {
        Bucket: this.bucketName,
        Key: targetFileName,
        Body: readStream
      };
      await this.storage.upload(params).promise()
      return true;
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  }

  async listFiles(maxFiles: number = 1000): Promise<Array<[string, number]>> {
    const params = {
      Bucket: this.bucketName,
      MaxKeys: maxFiles
    };
    return this.storage.listObjects(params).promise()
      .then(data => {
        const { Contents: content } = data;
        // console.log(data);
        return content.map(o => [o.Key, o.Size]) as [string, number][]
      })
      .catch(err => {
        console.log(err.message);
        throw new Error(err.message);
      })
  }
}

