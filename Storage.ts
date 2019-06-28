import 'multer';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import slugify from 'slugify';
import {
  IStorage,
  ConfigAmazonS3,
  ConfigGoogleCloud,
  ConfigLocal,
  StoreFileArgs,
  FileMetaData,
} from './types';

abstract class Storage implements IStorage {
  public static TYPE_GOOGLE_CLOUD: string = 'TYPE_GOOGLE_CLOUD';
  public static TYPE_AMAZON_S3: string = 'TYPE_AMAZON_S3';
  public static TYPE_LOCAL: string = 'TYPE_LOCAL';
  protected bucketName: string;
  protected bucketCreated: boolean = false;

  constructor(config: ConfigAmazonS3 | ConfigGoogleCloud | ConfigLocal) {
    // TODO: perform sanity tests?
    if (typeof config.bucketName === 'undefined') {
      throw new Error('bucket name is not defined');
    }
    this.bucketName = slugify(config.bucketName);
  }

  private async copy(origPath: string, args?: StoreFileArgs) {
    const {
      dir = null,
      name: newName = null,
      remove = false,
    } = args || {};

    try {
      const origName = path.basename(origPath);
      const fileSize = (await fs.promises.stat(origPath)).size;
      let targetPath = '';
      let targetName = slugify(origName);
      if (newName !== null) {
        targetName = slugify(newName);
      }
      if (dir !== null) {
        targetPath = slugify(dir);
      }
      targetPath = path.join(targetPath, targetName);
      // console.log(targetPath, remove);
      await this.store(origPath, targetPath);
      if (remove) {
        await fs.promises.unlink(origPath);
      }
      return {
        origName,
        size: fileSize,
        path: targetPath,
      };
    } catch (e) {
      // console.error('COPY', e);
      throw new Error(e.message);
    }
  }

  /**
   * @param tempFile: temporary Multer file
   * @param config?: setting for processing this file by the permanent storage
   * @param config.dir?: the directory to save this file into, directory will be created if it doesn't exist
   * @param config.newName?: the name of the file in the storage
   * @param config.remove?: whether or not to remove the temp file after it has been stored
   */
  async addFileFromUpload(file: Express.Multer.File, args?: StoreFileArgs): Promise<FileMetaData> {
    return this.copy(file.path, args);
  }

  /**
   * @param filePath: path to the file to be copied
   * @param config?: setting for processing this file by the permanent storage
   * @param config.dir?: the directory to save this file into, directory will be created if it doesn't exist
   * @param config.newName?: the name of the file in the storage
   * @param config.remove?: whether or not to remove the file after it has been copied to the storage
   */
  async addFileFromPath(origPath: string, args?: StoreFileArgs): Promise<FileMetaData> {
    return this.copy(origPath, args);
  }

  // stubs (to be overridden by subclasses)

  protected abstract async store(filePath: string, targetFileName: string): Promise<boolean>;

  abstract async createBucket(name?: string): Promise<boolean>;

  abstract async clearBucket(name?: string): Promise<boolean>;

  abstract async getFileAsReadable(name: string): Promise<Readable>;

  abstract async removeFile(fileName: string): Promise<boolean>;

  abstract async listFiles(): Promise<[string, number?][]>;
}

export {
  Storage,
};
