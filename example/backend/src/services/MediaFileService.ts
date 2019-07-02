// import {
//   Storage,
//   StorageGoogleCloud,
//   StorageAmazonS3,
//   StorageLocal,
//   StoreFileArgs,
//   FileMetaData,
// } from 'storage-abstraction';

import { Storage } from '../storage/Storage';
import { StorageGoogleCloud } from '../storage/StorageGoogleCloud';
import { StorageAmazonS3 } from '../storage/StorageAmazonS3';
import { StorageLocal } from '../storage/StorageLocal';
import { StoreFileArgs, FileMetaData } from '../storage/types';

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

@Service()
export class MediaFileService implements OnInit {
  private storage: Storage;

  constructor() {
    const type = getStorageType();
    if (type === Storage.TYPE_LOCAL) {
      const configLocal = {
        bucketName: getStorageBucketName(),
        directory: getLocalStorageDir(),
      };
      this.storage = new StorageLocal(configLocal);
    } else if (type === Storage.TYPE_GOOGLE_CLOUD) {
      const configGoogle = {
        bucketName: getStorageBucketName(),
        projectId: getGoogleStorageProjectId(),
        keyFilename: getGoogleStorageKeyFile(),
      };
      this.storage = new StorageGoogleCloud(configGoogle);
    } else if (type === Storage.TYPE_AMAZON_S3) {
      const configS3 = {
        bucketName: getStorageBucketName(),
        accessKeyId: getAmazonS3AccessKeyId(),
        secretAccessKey: getAmazonS3SecretAccessKey(),
      };
      this.storage = new StorageAmazonS3(configS3);
    }
    if (typeof this.storage === 'undefined') {
      throw new Error(`Storage is undefined: ${type}`);
    }
  }

  async $onInit(): Promise<boolean> {
    try {
      await this.storage.createBucket();
    } catch (e) {
      throw e;
    }
    return true;
  }

  /**
   * @param tempFile: uploaded file in temporary Multer storage
   * @param location?: the directory to save this file into, directory will be created if it doesn't exist
   */
  public async moveUploadedFile(tempFile: Express.Multer.File, location: string): Promise<FileMetaData> {
    const args: StoreFileArgs = {
      dir: location,
      name: `${uniquid()}_${tempFile.originalname}`,
      remove: false,
    };
    return this.storage.addFileFromUpload(tempFile, args);
  }

  /**
   * @param filePath: path to the file to be copied
   * @param location?: the directory to save this file into, directory will be created if it doesn't exist
   * @param config?: setting for processing this file by the permanent storage
   * @param config.dir?: the directory to save this file into, directory will be created if it doesn't exist
   * @param config.newName?: the name of the file in the storage
   * @param config.remove?: whether or not to remove the file after it has been copied to the storage
   */
  public async copyFile(filePath: string, args?: StoreFileArgs): Promise<FileMetaData> {
    return this.storage.addFileFromPath(filePath, args);
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
