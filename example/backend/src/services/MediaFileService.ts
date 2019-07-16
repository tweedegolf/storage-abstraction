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
  getEnv,
  getEnvOrDie,
} from '../env';
import { MediaFile } from '../entities/MediaFile';
import { StorageInitData } from '../../../common/types';

@Service()
export class MediaFileService implements OnInit {
  private _types: string[] = [];
  private _configs: { [id: string]: { type: string, config: StorageConfig } } = {};
  private storage: Storage | null = null;
  private storageId: string | null = null;

  constructor() {
    this._configs = {
      'Local disk storage': {
        type: Storage.TYPE_LOCAL,
        config: {
          bucketName: getEnv('STORAGE_1_BUCKETNAME'),
          directory: getEnv('STORAGE_1_DIRECTORY'),
        },
      },
      'Amazon S3': {
        type: Storage.TYPE_AMAZON_S3,
        config: {
          bucketName: getEnv('STORAGE_2_BUCKETNAME'),
          accessKeyId: getEnvOrDie('STORAGE_2_KEY_ID'),
          secretAccessKey: getEnvOrDie('STORAGE_2_ACCESS_KEY'),
        },
      },
      'Google Cloud 1': {
        type: Storage.TYPE_GOOGLE_CLOUD,
        config: {
          bucketName: getEnv('STORAGE_3_BUCKETNAME'),
          projectId: getEnvOrDie('STORAGE_3_PROJECT_ID'),
          keyFilename: getEnvOrDie('STORAGE_3_KEYFILE'),
        },
      },
      'Google Cloud 2': {
        type: Storage.TYPE_GOOGLE_CLOUD,
        config: {
          bucketName: getEnv('STORAGE_4_BUCKETNAME'),
          projectId: getEnvOrDie('STORAGE_4_PROJECT_ID'),
          keyFilename: getEnvOrDie('STORAGE_4_KEYFILE'),
        },
      },
    };

    this._types = Object.keys(this._configs);

    // You can create a storage here for instance by using environment variables or you
    // can create a storage after initialization using `setStorage`.
    // if (this._types.length > 0) {
    //   this.storageId = this._types[0];
    //   const config = this._configs[this.storageId].config;
    //   this.setStorage(config);
    // }
  }

  async $onInit(): Promise<void> {
    if (this.storage === null || this.storage.getSelectedBucket() === null) {
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

  public setStorageById(id: string): void {
    const config = this.configs[id].config;
    this.storageId = id;
    this.storage = new Storage(config);
  }

  public async getInitData(): Promise<StorageInitData> {
    let selectedBucket = null;
    let buckets = [];
    if (this.storage !== null) {
      try {
        selectedBucket = this.storage.getSelectedBucket();
        buckets = await this.getBuckets();
      } catch (e) {
        selectedBucket = null;
        this.storage = null;
        this.storageId = null;
      }
    }
    return {
      buckets,
      selectedBucket,
      files: [],
      types: this._types,
      selectedStorageId: this.storageId,
    };
  }

  public async selectBucket(bucket: string): Promise<void> {
    return this.storage.selectBucket(bucket);
  }

  get types() {
    return this._types;
  }

  get configs() {
    return this._configs;
  }

  /**
   * @param tempFile: uploaded file in temporary Multer storage
   * @param location?: the directory to save this file into, directory will be created if it doesn't exist
   */
  public async moveUploadedFile(tempFile: Express.Multer.File, location?: string): Promise<MediaFile> {
    try {
      const slugName = `${uniquid()}_${slugify(tempFile.originalname)}`;
      let targetPath = slugName;
      if (location) {
        const slugPath = location.split('/').map(d => slugify(d));
        slugPath.push(slugName);
        targetPath = slugPath.join('/');
      }

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
   * @param targetPath: path to copy the file to, must include file name, directories will be created if it doesn't exist
   */
  public async copyFile(filePath: string, targetPath: string): Promise<void> {
    return this.storage.addFileFromPath(filePath, targetPath);
  }

  public async getFileReadStream(filePath: string): Promise<Readable> {
    return this.storage.getFileAsReadable(filePath);
  }

  public async unlinkMediaFile(path: string): Promise<void> {
    return this.storage.removeFile(path);
  }

  public async getStoredFiles(): Promise<[string, number][]> {
    if (this.storage === null || this.storage.getSelectedBucket() === null) {
      return [];
    }
    return this.storage.listFiles();
  }

  public async getBuckets(): Promise<string[]> {
    return this.storage.listBuckets();
  }
}
