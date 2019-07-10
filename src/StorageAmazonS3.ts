import fs from 'fs';
import slugify from 'slugify';
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

  async createBucket(name: string): Promise<boolean> {
    const n = slugify(name);
    // console.log('createBucket', n);
    if (super.checkBucket(n)) {
      // console.log('CHECK BUCKET', n);
      return true;
    }
    try {
      const data = await this.storage.headBucket({ Bucket: n }).promise();
      // console.log('HEAD BUCKET', n, data);
      this.buckets.push(n);
      return true;
    } catch (e) {
      if (e.code === 'Forbidden') {
        // BucketAlreadyExists: The requested bucket name is not available.
        // The bucket namespace is shared by all users of the system.
        // Please select a different name and try again.
        throw e;
      }
      const data = await this.storage.createBucket({ Bucket: n }).promise();
      // console.log('CREATE BUCKET', n, data);
      this.buckets.push(n);
      return true;
    }
  }

  async selectBucket(name: string): Promise<boolean> {
    await this.createBucket(name);
    this.bucketName = name;
    return true;
  }

  async clearBucket(name?: string): Promise<boolean> {
    let n = name || this.bucketName;
    n = slugify(n);
    // console.log('clearBucket', n);
    const params1 = {
      Bucket: n,
      MaxKeys: 1000,
    };
    const { Contents: content } = await this.storage.listObjects(params1).promise();
    if (content.length === 0) {
      return true;
    }

    const params2 = {
      Bucket: n,
      Delete: {
        Objects: content.map(value => ({ Key: value.Key })),
        Quiet: false,
      },
    };
    await this.storage.deleteObjects(params2).promise();
    return true;
  }

  async deleteBucket(name?: string): Promise<boolean> {
    let n = name || this.bucketName;
    n = slugify(n);
    // try {
    //   const data = await this.storage.listObjectVersions({ Bucket: n }).promise();
    //   console.log(data);
    //   return true;
    // } catch (e) {
    //   throw e;
    // }
    // console.log('deleteBucket', n);
    try {
      await this.clearBucket(name);
      const result = await this.storage.deleteBucket({
        Bucket: n,
      }).promise();
      if (n === this.bucketName) {
        this.bucketName = null;
      }
      this.buckets = this.buckets.filter(b => b !== n);
      // console.log(this.buckets, result);
      return true;
    } catch (e) {
      if (e.code === 'NoSuchBucket') {
        return true;
      }
      throw e;
    }
  }

  async listBuckets(): Promise<string[]> {
    const data = await this.storage.listBuckets().promise();
    this.buckets = data.Buckets.map(d => d.Name);
    return this.buckets;
  }

  protected async store(origPath: string, targetPath: string): Promise<boolean>;
  protected async store(buffer: Buffer, targetPath: string): Promise<boolean>;
  protected async store(arg: string | Buffer, targetPath: string): Promise<boolean> {
    if (this.bucketName === null) {
      throw new Error('Please select a bucket first');
    }
    await this.createBucket(this.bucketName);
    let readable: Readable;
    if (typeof arg === 'string') {
      readable = fs.createReadStream(arg);
    } else if (arg instanceof Buffer) {
      readable = new Readable();
      readable._read = () => { }; // _read is required but you can noop it
      readable.push(arg);
      readable.push(null);
    }
    const params = {
      Bucket: this.bucketName,
      Key: targetPath,
      Body: readable,
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
