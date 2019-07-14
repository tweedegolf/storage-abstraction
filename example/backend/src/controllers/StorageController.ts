import {
  Controller,
  Get,
  PathParams,
} from '@tsed/common';
import { Returns, ReturnsArray } from '@tsed/swagger';
import { NotFound, UnsupportedMediaType, InternalServerError } from 'ts-httpexceptions';
import { Request, Response } from 'express';

import { MediaFileService } from '../services/MediaFileService';
import { ResError, ResSuccess, ResResult } from '../../../common/types';
import { MediaFileRepository } from '../services/repositories/MediaFileRepository';

@Controller('/storage')
export class StorageController {
  public constructor(
    private readonly mediaFileService: MediaFileService,
    private readonly mediaFileRepository: MediaFileRepository,
  ) { }

  @Get('/types')
  @Returns(200, { type: String })
  @Returns(500, { description: 'Internal server error' })
  public async getTypes(
  ): Promise<{ data: { types: string[] } }> {
    // await new Promise((resolve) => { setTimeout(resolve, 1000); });
    return {
      data: { types: this.mediaFileService.types },
    };
  }

  @Get('/buckets/:storage')
  @Returns(200, { type: String })
  public async getBuckets(
    @PathParams('storage') storage: string,
  ): Promise<{ data: { buckets: string[] } }> {
    this.mediaFileService.setStorageById(storage);
    await this.mediaFileRepository.synchronize();
    const buckets = await this.mediaFileService.getBuckets();
    return {
      data: { buckets },
    };
  }
}
