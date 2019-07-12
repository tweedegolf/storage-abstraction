import fs from 'fs';
import {
  Storage,
  StorageConfig,
} from 'storage-abstraction';
import slugify from 'slugify';
import uniquid from 'uniquid';
import { Service, OnInit } from '@tsed/di';
import { Readable } from 'stream';
import {
  getStorageType,
  getStorageBucketName,
  getGoogleStorageProjectId,
  getGoogleStorageKeyFile,
  getAmazonS3AccessKeyId,
  getAmazonS3SecretAccessKey,
  getLocalStorageDir,
} from '../env';
import { MediaFile } from '../entities/MediaFile';

@Service()
export class MediaFileService implements OnInit {
  private storage: Storage | null = null;

  constructor() {
    const type = getStorageType();
    let config: StorageConfig;
    if (type === Storage.TYPE_LOCAL) {
      config = {
        bucketName: getStorageBucketName(),
        directory: getLocalStorageDir(),
      };
    } else if (type === Storage.TYPE_GOOGLE_CLOUD) {
      config = {
        bucketName: getStorageBucketName(),
        projectId: getGoogleStorageProjectId(),
        keyFilename: getGoogleStorageKeyFile(),
      };
    } else if (type === Storage.TYPE_AMAZON_S3) {
      config = {
        bucketName: getStorageBucketName(),
        accessKeyId: getAmazonS3AccessKeyId(),
        secretAccessKey: getAmazonS3SecretAccessKey(),
      };
    }
    this.setStorage(config);
    if (typeof this.storage === 'undefined') {
      throw new Error(`Storage is undefined: ${type}`);
    }
  }

  async $onInit(): Promise<void> {
    if (this.storage !== null || this.storage.getSelectedBucket() === null) {
      return;
    }
    try {
      await this.storage.createBucket(this.storage.getSelectedBucket());
    } catch (e) {
      throw e;
    }
  }

  public setStorage(config: StorageConfig): void {
    this.storage = new Storage(config);
  }

  /**
   * @param tempFile: uploaded file in temporary Multer storage
   * @param location?: the directory to save this file into, directory will be created if it doesn't exist
   */
  public async moveUploadedFile(tempFile: Express.Multer.File, location: string): Promise<MediaFile> {
    try {
      const slugName = `${uniquid()}_${slugify(tempFile.originalname)}`;
      const slugPath = location.split('/').map(d => slugify(d));
      slugPath.push(slugName);
      const targetPath = slugPath.join('/');

      if (typeof tempFile.buffer !== 'undefined') {
        await this.storage.addFileFromBuffer(tempFile.buffer, targetPath);
      } else {
        await this.storage.addFileFromPath(tempFile.path, targetPath);
        await fs.promises.unlink(tempFile.path);
      }

      const mf = new MediaFile();
      mf.name = slugName;
      mf.path = targetPath;
      mf.size = tempFile.size;
      return mf;
    } catch (e) {
      throw e;
    }
  }

  /**
   * @param filePath: path to the file to be copied
   * @param location?: the directory to save this file into, directory will be created if it doesn't exist
   * @param config?: setting for processing this file by the permanent storage
   * @param config.path?: the directory to save this file into, directory will be created if it doesn't exist
   * @param config.newName?: the name of the file in the storage
   * @param config.remove?: whether or not to remove the file after it has been copied to the storage
   */
  public async copyFile(filePath: string, targetPath: string): Promise<boolean> {
    return this.storage.addFileFromPath(filePath, targetPath);
  }

  public async getFileReadStream(filePath: string): Promise<Readable> {
    return this.storage.getFileAsReadable(filePath);
  }

  public async unlinkMediaFile(path: string): Promise<boolean> {
    return this.storage.removeFile(path);
  }

  public async getStoredFiles(): Promise<[string, number][]> {
    return this.storage.listFiles();
  }
}
