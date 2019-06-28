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
import { NotFound, UnsupportedMediaType } from 'ts-httpexceptions';
import { Request, Response } from 'express';
import mime from 'mime';
import { pipeline } from 'stream';

import { MediaFileService } from '../services/MediaFileService';
import { MediaFile } from '../entities/MediaFile';
import uniquid from 'uniquid';

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
  @Returns(200, { type: MediaFile })
  @Returns(415, { description: 'Unsupported file type' })
  public async uploadFile(
    @MultipartFile('file') tempFile: Express.Multer.File,
    @BodyParams('location') location: string,
  ): Promise<ResSuccess<MediaFile>> {
    if (!tempFile) {
      throw new UnsupportedMediaType('Unsupported file type');
    }
    const [error, result] = await to(this.mediaFileService.moveUploadedFile(tempFile, {
      dir: location,
      name: `${uniquid()}_${tempFile.originalname}`,
      remove: true,
    }));

    if (error !== null) {
      return {
        error: error.message,
        data: null,
      };
    } else {
      // return {
      //   error: false,
      //   // data: await this.mediaFileRepository.create(file),
      // };
      return {
        error: false,
        data: result,
      };
    }
  }

  @Get('/list')
  @Returns(200, { type: Array })
  public async listFiles(
  ): Promise<ResSuccess<[string, number?][]>> {
    const [error, result] = await to(this.mediaFileService.getStoredFiles());
    if (error) {
      return {
        error: error.message,
        data: null,
      };
    }
    return {
      error: null,
      data: result,
    };
  }

  @Get('/delete/:filePath')
  @Returns(200, { type: Boolean })
  public async deleteFile(
    @Required @PathParams('filePath') filePath: string,
  ): Promise<ResSuccess<boolean>> {
    const [error, result] = await to(this.mediaFileService.unlinkMediaFile(filePath));
    if (error) {
      return {
        error: error.message,
        data: null,
      };
    }
    return {
      error: null,
      data: result,
    };
  }

  @Post('/delete')
  @Returns(200, { type: Boolean })
  public async deleteFile2(
    @Required @BodyParams('filePath') filePath: string,
  ): Promise<ResSuccess<boolean>> {
    const [error, result] = await to(this.mediaFileService.unlinkMediaFile(filePath));
    if (error) {
      return {
        error: error.message,
        data: null,
      };
    }
    return {
      error: null,
      data: result,
    };
  }
}
