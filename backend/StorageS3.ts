import S3 from 'aws-sdk/clients/s3';
import fs from 'fs';
import { Storage } from './Storage';
import { StorageConfigS3, File } from './types';
import slugify from 'slugify';

// export default class StorageS3 implements Storage {
export default class StorageS3 extends Storage {
  private storage: S3;
  protected bucketName: string
  protected bucketExists: boolean = false

  constructor(config: StorageConfigS3) {
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

  async removeFile(fileName: string): Promise<boolean> {
    const params = {
      Bucket: this.bucketName,
      Key: fileName
    };
    return this.storage.deleteObject(params).promise()
      .then(() => true)
      .catch(e => {
        console.error(e);
        return false;
      });
  }


  // util members

  async createBucket(name: string): Promise<boolean> {
    return this.storage.createBucket({ Bucket: name }).promise()
      .then(() => true)
      .catch(e => {
        console.error(e);
        return false;
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
      .then(data => { console.log(data); return true; })
      .catch(err => { console.error(err); return false; })
  }

  async getFiles(maxFiles: number = 1000): Promise<Array<[string, number]>> {
    const params = {
      Bucket: this.bucketName,
      MaxKeys: maxFiles
    };
    return this.storage.listObjects(params).promise()
      .then(data => {
        const { Contents: content } = data;
        return content.map(o => [o.Key, o.Size]) as [string, number][]
      })
      .catch(err => {
        console.log(err);
        return [] as [string, number][];
      })
  }
}

