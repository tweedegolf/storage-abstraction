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
import { StorageGoogle } from '../storage/StorageGoogle';
import { StorageS3 } from '../storage/StorageS3';
import { StorageLocal } from '../storage/StorageLocal';
import { ConfigStorageGoogle, ConfigStorageS3, ConfigStorageLocal } from '../storage/types';

@Service()
export class MediaFileService {
  public static getMediaFilePath = (filePath: string) => path.join(getLocalMediaStorageRoot(), filePath);

  private static getNewFilePath(filename, originalName, dir: string): string {
    const slug = slugify(`${filename}_${originalName}`).toLowerCase();
    return path.join(dir, slug);
  }

  private storage: Storage;
  private bucket: string;

  constructor(config: Object) {
    const type = Storage.TYPE_LOCAL;
    if (type === Storage.TYPE_LOCAL) {
      this.storage = new StorageGoogle(config as ConfigStorageGoogle);
    } else if (type === Storage.TYPE_AMAZON_S3) {
      this.storage = new StorageS3(config as ConfigStorageS3);
    } else if (type === Storage.TYPE_LOCAL) {
      this.storage = new StorageLocal(config as ConfigStorageLocal);
    }
  }

  public async moveUploadedFile(tempFile: Express.Multer.File, dir: string): Promise<MediaFile> {
    try {
      await this.storage.addFileFromUpload(tempFile);
      return this.instanceMediaFile({})
    } catch (e) {
      throw new Error(e.message);
    }
  }

  public async copyFixtureFile(filePath: string, dir: string): Promise<MediaFile> {
  }

  public async copyFile(filePath: string, originalName: string, dir: string) {
    this.storage.addFileFromPath(filePath);
  }

  public async getMediaFileReadStream(file: MediaFile): Promise<Readable> {
    return this.storage.getFileAsReadable(file.path);
  }

  public async unlinkMediaFile(file: MediaFile): Promise<boolean> {
    return this.storage.removeFile(file.path)
  }

  private instanceMediaFile(props): MediaFile {
    const { fileSize, originalName, newName } = props;

    const file = new MediaFile();
    file.size = fileSize;
    file.name = originalName;
    file.path = newName;

    return file;
  }
}
