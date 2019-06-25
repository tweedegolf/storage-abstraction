import { Service } from '@tsed/di';
import { MediaFile } from '../entities/MediaFile';
import { Storage } from '../storage/Storage';
import path from 'path';
import slugify from 'slugify';
import {
  getLocalMediaStorageRoot,
} from "../env";

export enum MediaStorageMethod {
  Local = 'local',
  GoogleCloud = 'google-cloud',
}

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

  constructor(type: string, config: Object) {
    if (type === Storage.TYPE_LOCAL) {
      this.storage = new StorageGoogleCloud(config as StorageTypes.ConfigGoogleCloud);
    } else if (type === Storage.TYPE_AMAZON_S3) {
      this.storage = new StorageAmazonS3(config as StorageTypes.ConfigAmazonS3);
    } else if (type === Storage.TYPE_LOCAL) {
      this.storage = new StorageLocal(config as StorageTypes.ConfigLocal);
    }
  }

  /**
   * @param tempFile: uploaded file in temporary Multer storage
   * @param dir?: the directory to save this file into, directory will be created if it doesn't exist
   * @param dir?: the directory to save this file into, directory will be created if it doesn't exist
   */
  public async moveUploadedFile(tempFile: Express.Multer.File, dir?: string, newName?: string, remove?: boolean): Promise<MediaFile> {
    try {
      const result: StorageTypes.FileMetaData = await this.storage.addFileFromUpload(tempFile, {
        dir,
        name: newName,
        remove,
      });
      return this.instanceMediaFile(result)
    } catch (e) {
      throw new Error(e.message);
    }
  }

  /**
   * @param filePath: path to the file to be copied
   * @param dir?: the directory to save this file into, directory will be created if it doesn't exist
   * @param remove?: whether or not to remove the file after it has been copied
   */
  public async copyFile(filePath: string, dir?: string, newName?: string, remove?: boolean): Promise<MediaFile> {
    try {
      const result: StorageTypes.FileMetaData = await this.storage.addFileFromPath(filePath, {
        dir,
        name: newName,
        remove,
      });
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
