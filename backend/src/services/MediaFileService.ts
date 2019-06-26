import { Service } from '@tsed/di';
import { MediaFile } from '../entities/MediaFile';
import { Storage } from '../storage/Storage';
import path from 'path';
import dotenv from 'dotenv';
import slugify from 'slugify';
import {
  getLocalMediaStorageRoot,
} from '../env';
dotenv.config();


import { Readable } from 'stream';
import { StorageGoogleCloud } from '../storage/StorageGoogleCloud';
import { StorageAmazonS3 } from '../storage/StorageAmazonS3';
import { StorageLocal } from '../storage/StorageLocal';
import { Storage as StorageTypes } from '../storage/types';

@Service()
export class MediaFileService {
  public static getMediaFilePath = (filePath: string) => path.join(getLocalMediaStorageRoot(), filePath);

  private static getNewFilePath(filename, originalName, dir: string): string {
    const slug = slugify(`${filename}_${originalName}`).toLowerCase();
    return path.join(dir, slug);
  }

  private storage: Storage;

  constructor() {
    const type = process.env.STORAGE_TYPE;
    if (type === Storage.TYPE_LOCAL) {
      const configLocal = {
        bucketName: process.env.STORAGE_BUCKETNAME,
        directory: process.env.STORAGE_LOCAL_DIRECTORY,
      }
      this.storage = new StorageLocal(configLocal);
    } else if (type === Storage.TYPE_GOOGLE_CLOUD) {
      const configGoogle = {
        bucketName: process.env.STORAGE_BUCKETNAME,
        projectId: process.env.STORAGE_GOOGLE_CLOUD_PROJECT_ID,
        keyFilename: process.env.STORAGE_GOOGLE_CLOUD_KEYFILE,
      }
      this.storage = new StorageGoogleCloud(configGoogle);
    } else if (type === Storage.TYPE_AMAZON_S3) {
      const configS3 = {
        bucketName: process.env.STORAGE_BUCKETNAME,
        accessKeyId: process.env.STORAGE_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.STORAGE_AWS_SECRET_ACCESS_KEY,
      }
      this.storage = new StorageAmazonS3(configS3);
    }
  }

  /**
   * @param tempFile: uploaded file in temporary Multer storage
   * @param config?: setting for processing this file by the permanent storage
   * @param config.dir?: the directory to save this file into, directory will be created if it doesn't exist
   * @param config.newName?: the name of the file in the storage
   * @param config.remove?: whether or not to remove the temp file after it has been stored
   */
  public async moveUploadedFile(tempFile: Express.Multer.File, args?: StorageTypes.AddFileArgs): Promise<MediaFile> {
    try {
      const result: StorageTypes.FileMetaData = await this.storage.addFileFromUpload(tempFile, args);
      return this.instanceMediaFile(result)
    } catch (e) {
      throw new Error(e.message);
    }
  }

  /**
   * @param filePath: path to the file to be copied
   * @param config?: setting for processing this file by the permanent storage
   * @param config.dir?: the directory to save this file into, directory will be created if it doesn't exist
   * @param config.newName?: the name of the file in the storage
   * @param config.remove?: whether or not to remove the file after it has been copied to the storage
   */
  public async copyFile(filePath: string, args?: StorageTypes.AddFileArgs): Promise<MediaFile> {
    try {
      const result: StorageTypes.FileMetaData = await this.storage.addFileFromPath(filePath, args);
      return this.instanceMediaFile(result)
    } catch (e) {
      throw new Error(e.message);
    }
  }

  public async getMediaFileReadStream(file: MediaFile): Promise<Readable> {
    try {
      const stream = await this.storage.getFileAsReadable(file.path);
      return stream;
    } catch (e) {
      throw e
    }
  }

  public async unlinkMediaFile(file: MediaFile): Promise<boolean> {
    try {
      await this.storage.removeFile(file.path)
      return true
    } catch (e) {
      throw e;
    }
  }

  private instanceMediaFile(props: { size: number, name: string, path: string }): MediaFile {
    const file = new MediaFile();
    Object.assign(file, props);
    return file;
  }
}
