import S3 from 'aws-sdk/clients/s3';
import fs from 'fs';
import { Storage } from './Storage';
import { StorageConfigS3, File } from './types';

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
    this.bucketName = bucketName
  }

  async deleteFile(file: File): Promise<boolean> {
    return true;
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
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(filePath);
      const params = {
        Bucket: this.bucketName,
        Key: targetFileName,
        Body: readStream
      };
      this.storage.upload(params).promise()
        .then(data => { console.log(data); resolve(true); })
        .catch(err => { console.error(err); reject(false); })

      // const writeStream = this.storage.bucket(this.bucketName).file(targetFileName).createWriteStream();
      // readStream.on('end', () => {
      //   resolve(true);
      // });
      // readStream.on('error', (e: Error) => {
      //   console.log(e);
      //   reject(false);
      // });
      // readStream.pipe(writeStream);
    });
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

