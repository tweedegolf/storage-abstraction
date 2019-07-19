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
} from '../env';
import { MediaFile } from '../entities/MediaFile';
import { StorageInitData } from '../../../common/types';
import { NotFound } from 'ts-httpexceptions';

@Service()
export class MediaFileService implements OnInit {
  private _configIds: string[] = [];
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
      // 'Amazon S3': {
      //   type: Storage.TYPE_AMAZON_S3,
      //   config: {
      //     bucketName: getEnv('STORAGE_2_BUCKETNAME'),
      //     accessKeyId: getEnvOrDie('STORAGE_2_KEY_ID'),
      //     secretAccessKey: getEnvOrDie('STORAGE_2_ACCESS_KEY'),
      //   },
      // },
      // 'Google Cloud 1': {
      //   type: Storage.TYPE_GOOGLE_CLOUD,
      //   config: {
      //     bucketName: getEnv('STORAGE_3_BUCKETNAME'),
      //     projectId: getEnvOrDie('STORAGE_3_PROJECT_ID'),
      //     keyFilename: getEnvOrDie('STORAGE_3_KEYFILE'),
      //   },
      // },
      // 'Google Cloud 2': {
      //   type: Storage.TYPE_GOOGLE_CLOUD,
      //   config: {
      //     bucketName: getEnv('STORAGE_4_BUCKETNAME'),
      //     projectId: getEnvOrDie('STORAGE_4_PROJECT_ID'),
      //     keyFilename: getEnvOrDie('STORAGE_4_KEYFILE'),
      //   },
      // },
    };

    this._configIds = Object.keys(this._configs);

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
    const numConfigs = Object.keys(this._configs).length;
    if (numConfigs === 0) {
      throw new NotFound('no storage configuration found');
    }

    if (numConfigs === 1 && this.storage === null) {
      this.storageId = this._configIds[0];
      this.storage = new Storage(this._configs[this.storageId].config);
    }

    let selectedStorageId = this.storageId;
    let selectedBucket = null;
    let buckets = [];
    if (this.storage !== null) {
      try {
        buckets = await this.getBuckets();
        if (buckets.length === 1 && numConfigs === 1) {
          selectedBucket = buckets[0];
          this.storage.selectBucket(selectedBucket);
        }
      } catch (e) {
        // if it fails, there is an error with the storage
        selectedBucket = null;
        selectedStorageId = null;
        this.storage = null;
        this.storageId = null;
      }
      try {
        selectedBucket = this.storage.getSelectedBucket();
      } catch (e) {
        selectedBucket = null;
      }
    }
    return {
      selectedStorageId,
      selectedBucket,
      buckets,
      files: [],
      types: this._configIds,
    };
  }

  public async selectBucket(bucket: string): Promise<void> {
    return this.storage.selectBucket(bucket);
  }

  get types() {
    return this._configIds;
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

  public async createBucket(bucketName: string): Promise<string[]> {
    if (this.storage === null) {
      throw new NotFound('no storage selected yet');
    }
    await this.storage.createBucket(bucketName);
    return this.storage.listBuckets();
  }

  public async deleteBucket(bucketName: string): Promise<string[]> {
    if (this.storage === null) {
      throw new NotFound('no storage selected yet');
    }
    await this.storage.deleteBucket(bucketName);
    const buckets = await this.storage.listBuckets();
    if (buckets.length === 1) {
      await this.storage.selectBucket(buckets[0]);
    } else {
      this.storage.selectBucket(null);
    }
    return buckets;
  }
}
