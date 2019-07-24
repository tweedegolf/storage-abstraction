import {
  Controller,
  Get,
  PathParams,
  Post,
  Delete,
} from '@tsed/common';
import { Returns, ReturnsArray } from '@tsed/swagger';

import { MediaFileService } from '../services/MediaFileService';
import { MediaFileRepository } from '../services/repositories/MediaFileRepository';
import { StorageInitData, BucketData } from '../../../common/types';

@Controller('/storage')
export class StorageController {
  public constructor(
    private readonly mediaFileService: MediaFileService,
    private readonly mediaFileRepository: MediaFileRepository,
  ) { }

  private async getBucketData(buckets: string[]): Promise<BucketData> {
    let selectedBucket: string | null = null;
    let files = [];
    if (buckets.length === 1) {
      selectedBucket = buckets[0];
      await this.mediaFileService.selectBucket(selectedBucket);
      await this.mediaFileRepository.synchronize();
      files = await this.mediaFileRepository.find();
    }
    return {
      files,
      buckets,
      selectedBucket,
    };
  }

  @Get('/init')
  @ReturnsArray(200, { type: String })
  @Returns(500, { description: 'Internal server error' })
  public async init(
  ): Promise<StorageInitData> {
    const data = await this.mediaFileService.getInitData();
    if (data.selectedBucket !== null) {
      await this.mediaFileRepository.synchronize();
    }
    data.files = await this.mediaFileRepository.find();
    return data;
  }

  @Get('/types')
  @ReturnsArray(200, { type: String })
  @Returns(500, { description: 'Internal server error' })
  public async getTypes(
  ): Promise<string[]> {
    // await new Promise((resolve) => { setTimeout(resolve, 1000); });
    return this.mediaFileService.types;
  }

  @Get('/buckets/:storageId')
  @ReturnsArray(200, { type: String })
  @Returns(500, { description: 'Internal server error' })
  public async getBuckets(
    @PathParams('storageId') storageId: string,
  ): Promise<BucketData> {
    this.mediaFileService.setStorageById(storageId);
    await this.mediaFileRepository.synchronize();
    const buckets = await this.mediaFileService.getBuckets();
    return this.getBucketData(buckets);
  }

  @Post('/bucket/:bucketname')
  @ReturnsArray(200, { type: String })
  @Returns(500, { description: 'Internal server error' })
  public async createBucket(
    @PathParams('bucketname') bucketName: string,
  ): Promise<BucketData> {
    const buckets = await this.mediaFileService.createBucket(bucketName);
    await this.mediaFileService.selectBucket(bucketName);
    return {
      buckets,
      files: [],
      selectedBucket: bucketName,
    };
  }

  @Delete('/bucket/:bucketname')
  @ReturnsArray(200, { type: String })
  @Returns(500, { description: 'Internal server error' })
  public async deleteBucket(
    @PathParams('bucketname') bucketName: string,
  ): Promise<BucketData> {
    const buckets = await this.mediaFileService.deleteBucket(bucketName);
    return this.getBucketData(buckets);
  }
}
