import 'multer';
import path from 'path';
import { stat, unlink } from './utils';
import { StorageConfigGoogle, StorageConfigS3 } from './types';

class Storage {
  protected bucketName: string
  protected bucketExists: boolean = false

  constructor(config: StorageConfigS3 | StorageConfigGoogle | StorageConfigS3) {
    // TODO: perform sanity tests?
  }

  async addFileFromPath(filePath: string, newFileName?: string): Promise<boolean> {
    if (this.bucketExists === false) {
      this.bucketExists = await this.createBucket(this.bucketName)
    }
    const targetFileName = newFileName || path.basename(filePath);
    return this.store(filePath, targetFileName);
  }

  async addFile(file: Express.Multer.File, newFileName?: string): Promise<number | null> {
    const filePath = file.path;
    const fileSize = (await stat(filePath)).size;
    const fileName = newFileName || path.basename(filePath);

    await this.store(filePath, fileName);
    return unlink(file.path)
      .then(() => fileSize)
      .catch(e => {
        console.error(e);
        return null;
      })
  }

  // stubs (to be overridden by subclasses)

  protected async store(filePath: string, targetFileName: string): Promise<boolean> {
    return new Promise<boolean>(() => { });
  }

  async createBucket(name: string): Promise<boolean> {
    return new Promise<boolean>(() => { });
  }
}

export {
  Storage,
}