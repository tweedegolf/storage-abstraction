import {
  Storage,
  StorageGoogleCloud,
  StorageAmazonS3,
  StorageLocal,
  StoreFileArgs,
  FileMetaData,
} from 'storage-abstraction';

import { Service } from '@tsed/di';
import { MediaFile } from '../entities/MediaFile';
import dotenv from 'dotenv';
dotenv.config();

import { Readable } from 'stream';

@Service()
export class MediaFileService {

  private storage: Storage;

  constructor() {
    const type = process.env.STORAGE_TYPE;
    if (type === Storage.TYPE_LOCAL) {
      const configLocal = {
        bucketName: process.env.STORAGE_BUCKETNAME,
        directory: process.env.STORAGE_LOCAL_DIRECTORY,
      };
      this.storage = new StorageLocal(configLocal);
    } else if (type === Storage.TYPE_GOOGLE_CLOUD) {
      const configGoogle = {
        bucketName: process.env.STORAGE_BUCKETNAME,
        projectId: process.env.STORAGE_GOOGLE_CLOUD_PROJECT_ID,
        keyFilename: process.env.STORAGE_GOOGLE_CLOUD_KEYFILE,
      };
      this.storage = new StorageGoogleCloud(configGoogle);
    } else if (type === Storage.TYPE_AMAZON_S3) {
      const configS3 = {
        bucketName: process.env.STORAGE_BUCKETNAME,
        accessKeyId: process.env.STORAGE_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.STORAGE_AWS_SECRET_ACCESS_KEY,
      };
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
  public async moveUploadedFile(tempFile: Express.Multer.File, args?: StoreFileArgs): Promise<MediaFile> {
    try {
      const result: FileMetaData = await this.storage.addFileFromUpload(tempFile, args);
      return this.instanceMediaFile(result);
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
  public async copyFile(filePath: string, args?: StoreFileArgs): Promise<MediaFile> {
    try {
      const result: FileMetaData = await this.storage.addFileFromPath(filePath, args);
      return this.instanceMediaFile(result);
    } catch (e) {
      throw new Error(e.message);
    }
  }

  public async getMediaFileReadStream(file: MediaFile): Promise<Readable> {
    try {
      const stream = await this.storage.getFileAsReadable(file.path);
      return stream;
    } catch (e) {
      throw e;
    }
  }

  public async unlinkMediaFile(file: MediaFile): Promise<boolean> {
    try {
      await this.storage.removeFile(file.path);
      return true;
    } catch (e) {
      throw e;
    }
  }

  private instanceMediaFile(props: { size: number, origName: string, path: string }): MediaFile {
    const file = new MediaFile();
    // Object.assign(file, props);
    ({
      size: file.size,
      path: file.path,
      origName: file.name,
    } = props);
    return file;
  }
}
