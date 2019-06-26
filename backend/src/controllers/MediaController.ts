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
} from '@tsed/common';
import { MultipartFile } from '@tsed/multipartfiles';
import { Returns, ReturnsArray } from '@tsed/swagger';
import { NotFound, UnsupportedMediaType } from 'ts-httpexceptions';
import { Request, Response } from 'express';
import mime from 'mime';
import { pipeline } from 'stream';

import { MediaFileService } from '../services/MediaFileService';
import { MediaFile } from '../entities/MediaFile';

interface ResSuccess<T> {
  error: false;
  data: T;
}

export const SUPPORTED_MIME_TYPES = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
  'image/svg',
  'application/svg',
  'application/svg+xml',
  'application/pdf',
  'application/x-pdf',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

@Controller('/media')
export class MediaFileController {
  public constructor(
    private readonly mediaFileService: MediaFileService,
  ) {
  }

  @Post('/')
  @Returns(200, { type: Boolean })
  @Returns(415, { description: 'Unsupported file type' })
  public async uploadFile(
    @MultipartFile('file') tempFile: Express.Multer.File,
    @BodyParams('location') location: string,
  ): Promise<ResSuccess<boolean>> {
    if (!tempFile) {
      throw new UnsupportedMediaType('Unsupported file type');
    }
    console.log('LOCATION', location);

    const [error, result] = await to(this.mediaFileService.moveUploadedFile(tempFile));

    if (error !== null) {
      return {
        error: error.message,
        data: false,
      };
    } else {
      // return {
      //   error: false,
      //   // data: await this.mediaFileRepository.create(file),
      // };
      return {
        error: false,
        data: false,
      };
    }

  }

}