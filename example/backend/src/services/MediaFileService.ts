import {
  Storage,
  StorageGoogleCloud,
  StorageAmazonS3,
  StorageLocal,
  StoreFileArgs,
  FileMetaData,
} from 'storage-abstraction';
import uniquid from 'uniquid';
import { Service } from '@tsed/di';
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
export class MediaFileService {
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

  /**
   * @param tempFile: uploaded file in temporary Multer storage
   * @param location?: the directory to save this file into, directory will be created if it doesn't exist
   */
  public async moveUploadedFile(tempFile: Express.Multer.File, location: string): Promise<FileMetaData> {
    const args: StoreFileArgs = {
      dir: location,
      name: `${uniquid()}_${tempFile.originalname}`,
      remove: true,
    };
    try {
      const result: FileMetaData = await this.storage.addFileFromUpload(tempFile, args);
      return result;
    } catch (e) {
      throw new Error(e.message);
    }
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
    try {
      const result = await this.storage.addFileFromPath(filePath, args);
      return result;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  public async getFileReadStream(filePath: string): Promise<Readable> {
    try {
      const stream = await this.storage.getFileAsReadable(filePath);
      return stream;
    } catch (e) {
      throw e;
    }
  }

  public async unlinkMediaFile(path: string): Promise<boolean> {
    try {
      await this.storage.removeFile(path);
      return true;
    } catch (e) {
      throw e;
    }

  }

  public async getStoredFiles(): Promise<[string, number?][]> {
    try {
      const files = await this.storage.listFiles();
      return files;
    } catch (e) {
      throw e;
    }
  }
}
