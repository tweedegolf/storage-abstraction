import fs from 'fs';
import { Readable } from 'stream';
import S3 from 'aws-sdk/clients/s3';
import { AbstractStorage } from './AbstractStorage';
import { ConfigAmazonS3, IStorage } from './types';

export class StorageAmazonS3 extends AbstractStorage implements IStorage {
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
    // console.log(config, this.bucketName);
  }

  async getFileAsReadable(fileName: string): Promise<Readable> {
    const params = {
      Bucket: this.bucketName,
      Key: fileName,
    };
    // check if exists
    await this.storage.getObject(params).promise();
    // then return stream
    return this.storage.getObject(params).createReadStream();
  }

  async removeFile(fileName: string): Promise<boolean> {
    const params = {
      Bucket: this.bucketName,
      Key: fileName,
    };
    await this.storage.deleteObject(params).promise();
    return true;
  }

  // util members

  async createBucket(name?: string): Promise<boolean> {
    super.createBucket(name);
    if (this.bucketCreated) {
      return true;
    }
    await this.storage.createBucket({ Bucket: this.bucketName }).promise();
    return true;
  }

  async clearBucket(): Promise<boolean> {
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
  }

  protected async store(filePath: string, targetFileName: string): Promise<boolean> {
    await this.createBucket();
    const readStream = fs.createReadStream(filePath);
    const params = {
      Bucket: this.bucketName,
      Key: targetFileName,
      Body: readStream,
    };
    await this.storage.upload(params).promise();
    return true;
  }

  async listFiles(maxFiles: number = 1000): Promise<[string, number][]> {
    const params = {
      Bucket: this.bucketName,
      MaxKeys: maxFiles,
    };
    const { Contents: content } = await this.storage.listObjects(params).promise();
    return content.map(o => [o.Key, o.Size]) as [string, number][];
  }
}
