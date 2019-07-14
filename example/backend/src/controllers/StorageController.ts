import {
  Controller,
  Get,
  PathParams,
} from '@tsed/common';
import { Returns, ReturnsArray } from '@tsed/swagger';

import { MediaFileService } from '../services/MediaFileService';
import { MediaFileRepository } from '../services/repositories/MediaFileRepository';

@Controller('/storage')
export class StorageController {
  public constructor(
    private readonly mediaFileService: MediaFileService,
    private readonly mediaFileRepository: MediaFileRepository,
  ) { }

  @Get('/types')
  @ReturnsArray(200, { type: String })
  @Returns(500, { description: 'Internal server error' })
  public async getTypes(
  ): Promise<string[]> {
    // await new Promise((resolve) => { setTimeout(resolve, 1000); });
    return this.mediaFileService.types;
  }

  @Get('/buckets/:storage')
  @ReturnsArray(200, { type: String })
  public async getBuckets(
    @PathParams('storage') storage: string,
  ): Promise<string[]> {
    this.mediaFileService.setStorageById(storage);
    await this.mediaFileRepository.synchronize();
    return this.mediaFileService.getBuckets();
  }
}
