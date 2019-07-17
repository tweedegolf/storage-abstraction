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
import { StorageInitData } from '../../../common/types';

@Controller('/storage')
export class StorageController {
  public constructor(
    private readonly mediaFileService: MediaFileService,
    private readonly mediaFileRepository: MediaFileRepository,
  ) { }

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

  @Get('/buckets/:id')
  @ReturnsArray(200, { type: String })
  @Returns(500, { description: 'Internal server error' })
  public async getBuckets(
    @PathParams('id') id: string,
  ): Promise<string[]> {
    this.mediaFileService.setStorageById(id);
    await this.mediaFileRepository.synchronize();
    return this.mediaFileService.getBuckets();
  }

  @Post('/bucket/:bucketname')
  @ReturnsArray(200, { type: String })
  @Returns(500, { description: 'Internal server error' })
  public async createBucket(
    @PathParams('bucketname') bucketname: string,
  ): Promise<string[]> {
    return this.mediaFileService.createBucket(bucketname);
  }

  @Delete('/bucket/:bucketname')
  @ReturnsArray(200, { type: String })
  @Returns(500, { description: 'Internal server error' })
  public async deleteBucket(
    @PathParams('bucketname') bucketname: string,
  ): Promise<string[]> {
    return this.mediaFileService.deleteBucket(bucketname);
  }
}
