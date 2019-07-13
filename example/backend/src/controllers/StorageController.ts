import to from 'await-to-js';
import {
  BodyParams,
  Controller,
  Delete,
  Get,
  PathParams,
  Post,
  Req,
  Res,
  Required,
} from '@tsed/common';
import { Returns, ReturnsArray } from '@tsed/swagger';
import { NotFound, UnsupportedMediaType, InternalServerError } from 'ts-httpexceptions';
import { Request, Response } from 'express';

import { MediaFileService } from '../services/MediaFileService';
import { ResError, ResSuccess, ResResult } from '../../../common/types';
import { Storage, StorageConfig } from 'storage-abstraction';
import {
  getStorageTypes,
  getStorageBucketName,
  getLocalStorageDir,
  getGoogleStorageProjectId,
  getGoogleStorageKeyFile,
  getAmazonS3AccessKeyId,
  getAmazonS3SecretAccessKey,
} from '../env';


@Controller('/storage')
export class StorageController {
  private types: string[][] = [];
  private configs: { [id: string]: StorageConfig } = {};
  public constructor(
    private readonly mediaFileService: MediaFileService,
  ) {
    this.types.push(...getStorageTypes().split(' ').map(t => [t, Storage.friendlyNames[t]]));
    this.types.forEach(([type]) => {
      if (type === Storage.TYPE_LOCAL) {
        this.configs[type] = {
          bucketName: getStorageBucketName(),
          directory: getLocalStorageDir(),
        };
      } else if (type === Storage.TYPE_GOOGLE_CLOUD) {
        this.configs[type] = {
          bucketName: getStorageBucketName(),
          projectId: getGoogleStorageProjectId(),
          keyFilename: getGoogleStorageKeyFile(),
        };
      } else if (type === Storage.TYPE_AMAZON_S3) {
        this.configs[type] = {
          bucketName: getStorageBucketName(),
          accessKeyId: getAmazonS3AccessKeyId(),
          secretAccessKey: getAmazonS3SecretAccessKey(),
        };
      }
    });
  }

  @Get('/types')
  @Returns(200, { type: String })
  @Returns(500, { description: 'Internal server error' })
  public async getTypes(
  ): Promise<ResResult<{ types: string[][] }>> {
    // await new Promise((resolve) => { setTimeout(resolve, 1000); });
    return {
      error: false,
      data: { types: this.types },
    };
  }

  @Get('/buckets/:storage')
  @Returns(200, { type: String })
  @Returns(500, { description: 'Internal server error' })
  public async getBuckets(
    @PathParams('storage') storage: string,
  ): Promise<ResResult<{ buckets: string[] }>> {
    this.mediaFileService.setStorage(this.configs[storage]);
    try {
      const buckets = await this.mediaFileService.getBuckets();
      return {
        error: false,
        data: { buckets },
      };
    } catch (e) {
      return {
        error: true,
        data: null,
        message: e.message,
        status: 500,
      } as ResError;
    }
  }
}
