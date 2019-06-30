import fs from 'fs';
import { Readable } from 'stream';
import S3 from 'aws-sdk/clients/s3';
import { Storage } from './Storage';
import { ConfigAmazonS3, IStorage } from './types';

export class StorageAmazonS3 extends Storage implements IStorage {
  private storage: S3;
  protected bucketName: string;

  constructor(config: ConfigAmazonS3) {
    super(config);
    const {
      accessKeyId,
      secretAccessKey,
    } = config;
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('provide both an accessKeyId and a secretAccessKey!');
    }
    this.storage = new S3({
      accessKeyId,
      secretAccessKey,
      apiVersion: '2006-03-01',
    });
  }

  async getFileAsReadable(fileName: string): Promise<Readable> {
    const params = {
      Bucket: this.bucketName,
      Key: fileName,
    };
    return this.storage.getObject(params).promise()
      .then(() => this.storage.getObject(params).createReadStream())
      .catch((err: Error) => {
        console.log(err.message);
        throw new Error(err.message);
      });
  }

  async removeFile(fileName: string): Promise<boolean> {
    const params = {
      Bucket: this.bucketName,
      Key: fileName,
    };
    return this.storage.deleteObject(params).promise()
      .then((data) => {
        // console.log(data)
        return true;
      })
      .catch((err: Error) => {
        console.log(err.message);
        throw new Error(err.message);
      });
  }

  // util members

  async createBucket(): Promise<boolean> {
    if (this.bucketCreated) {
      return true;
    }
    return this.storage.createBucket({ Bucket: this.bucketName }).promise()
      .then(() => {
        this.bucketCreated = true;
        return true;
      })
      .catch((err: Error) => {
        console.log(err.message);
        throw new Error(err.message);
      });
  }

  async clearBucket(): Promise<boolean> {
    try {
      const params1 = {
        Bucket: this.bucketName,
        MaxKeys: 1000,
      };
      const { Contents: content } = await this.storage.listObjects(params1).promise();
      const params2 = {
        Bucket: this.bucketName,
        Delete: {
          Objects: content.map(value => ({ Key: value.Key })),
          Quiet: false,
        },
      };
      await this.storage.deleteObjects(params2).promise();
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
        Body: readStream,
      };
      await this.storage.upload(params).promise();
      return true;
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  }

  async listFiles(maxFiles: number = 1000): Promise<[string, number][]> {
    const params = {
      Bucket: this.bucketName,
      MaxKeys: maxFiles,
    };
    return this.storage.listObjects(params).promise()
      .then((data) => {
        const { Contents: content } = data;
        // console.log(data);
        return content.map(o => [o.Key, o.Size]) as [string, number][];
      })
      .catch((err: Error) => {
        console.log(err.message);
        throw new Error(err.message);
      });
  }
}
