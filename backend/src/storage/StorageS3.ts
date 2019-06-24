import S3 from 'aws-sdk/clients/s3';
import fs from 'fs';
import { Storage, IStorage } from './Storage';
import { ConfigStorageS3 } from './types';
import slugify from 'slugify';
import { Readable } from 'stream';

export class StorageS3 extends Storage implements IStorage {
  private storage: S3;
  protected bucketName: string

  constructor(config: ConfigStorageS3) {
    super(config)
    const {
      bucketName,
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
    this.bucketName = slugify(bucketName);
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
      Bucket: 'this.bucketName',
      Key: fileName
    };
    return this.storage.deleteObject(params).promise()
      .then(() => true)
      .catch(err => {
        console.log(err.message);
        throw new Error(err.message)
      });
  }


  // util members

  async createBucket(): Promise<boolean> {
    return this.storage.createBucket({ Bucket: this.bucketName }).promise()
      .then(() => true)
      .catch(err => {
        console.log(err.message);
        throw new Error(err.message)
      })
  }

  protected async store(filePath: string, targetFileName: string): Promise<boolean> {
    const readStream = fs.createReadStream(filePath);
    const params = {
      Bucket: this.bucketName,
      Key: targetFileName,
      Body: readStream
    };
    return this.storage.upload(params).promise()
      .then(() => true)
      .catch(err => {
        console.log(err.message);
        throw new Error(err.message);
      })
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

