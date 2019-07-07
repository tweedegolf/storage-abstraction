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
import { MultipartFile } from '@tsed/multipartfiles';
import { Returns, ReturnsArray } from '@tsed/swagger';
import { NotFound, UnsupportedMediaType, InternalServerError } from 'ts-httpexceptions';
import { Request, Response } from 'express';
import mime from 'mime';
import { pipeline } from 'stream';

import { MediaFileService } from '../services/MediaFileService';
import { MediaFile } from '../entities/MediaFile';
import { MediaFileRepository } from '../services/repositories/MediaFileRepository';
import { ThumbnailService } from '../services/ThumbnailService';
import { FileMetaData } from 'storage-abstraction';
import { ResError, ResSuccess, ResResult } from '../../../common/types';


@Controller('/storage')
export class StorageController {
  public constructor(
    private readonly mediaFileService: MediaFileService,
  ) { }

  @Post('/')
  @Returns(200, { type: Boolean })
  @Returns(415, { description: 'Unsupported file type' })
  @Returns(500, { description: 'Internal server error' })
  public async changeStorage(
    @BodyParams('location') location: string,
  ): Promise<ResResult<boolean>> {

    return {
      error: false,
      data: true,
    };
  }
}
