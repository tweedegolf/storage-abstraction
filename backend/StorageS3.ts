import S3 from 'aws-sdk/clients/s3';
import { Storage, StorageConfigS3, File } from './types';

// export default class StorageS3 implements Storage {
export default class StorageS3 {
  private storage: S3;

  constructor(config: StorageConfigS3) {
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

  async createBucket(name: string): Promise<Object | Error> {
    return this.storage.createBucket({ Bucket: name }).promise()
  }

  async storeFile(file: File): Promise<boolean> {

    return true;
  }

  async deleteFile(file: File): Promise<boolean> {
    return true;
  }

  async getFilesInBucket(name: string, maxFiles: number = 1000) {
    const params = {
      Bucket: name,
      MaxKeys: maxFiles
    };
    const files = await this.storage.listObjects(params).promise()
      .catch(err => {
        console.log(err);
        return [];
      })
    return files;
  }
}

