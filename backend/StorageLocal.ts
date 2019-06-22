import { StorageConfigLocal } from './types';

/*
  copy file
  delete file

*/

// export default class StorageGoogle implements Storage {
export default class StorageLocal {

  constructor(config: StorageConfigLocal) {
    const {
      directory,
    } = config;
  }

  async createBucket(name: string): Promise<boolean> {
    return this.storage.createBucket(name)
      .then(data => {
        // console.log(data)
        return true;
      })
      .catch(err => {
        console.log(err);
        return false;
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

  async storeFile(file: File): Promise<boolean> {
    return true;
  }

  async deleteFile(file: File): Promise<boolean> {
    return true;
  }
}

