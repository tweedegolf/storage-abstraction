import {
  Storage,
  StorageGoogleCloud,
  StorageAmazonS3,
  StorageLocal,
  StoreFileArgs,
  FileMetaData,
} from 'storage-abstraction';

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

  async $onInit(): Promise<boolean> {
    try {
      await this.storage.createBucket();
    } catch (e) {
      throw e;
    }
    return true;
  }

  public setStorage(config: StorageConfig): void {
    this.storage = new Storage(config);
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
