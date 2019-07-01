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
    private readonly mediaFileRepository: MediaFileRepository,
    private readonly thumbnailerService: ThumbnailService,
  ) { }

  private async getMediaFile(id: number, filePath?: string): Promise<MediaFile> {
    const mediaFile = await this.mediaFileRepository.findOne(id);

    if (!mediaFile) {
      throw new NotFound('File not found in repository');
    }

    if (typeof filePath !== 'undefined' && mediaFile.path !== filePath) {
      throw new NotFound('File not found: supplied file path doesn\'t match with file path in repository');
    }

    return mediaFile;
  }

  private async download(res: Response, id: number, filePath?: string) {
    const mediaFile = await this.getMediaFile(id, filePath);
    const [error, stream] = await to(this.mediaFileService.getFileReadStream(mediaFile.path));

    if (error !== null) {
      throw new NotFound('File not found in Storage');
    }

    res.set('Content-Type', mime.getType(mediaFile.path));
    res.set('Content-Disposition', 'inline');

    await new Promise(
      (resolve, reject) => pipeline(
        stream,
        res,
        err => (err ? reject(err) : resolve()),
      ),
    );
  }

  private async getThumb(res: Response, id: number, format: 'pjpeg' | 'png', width: number, filePath?: string) {
    const mediaFile = await this.getMediaFile(id, filePath);

    const { success, stream, contentType } = await this.thumbnailerService.getThumbnailReadStream(
      mediaFile.path,
      { format, width },
    );

    if (!success) {
      throw new NotFound('File not found');
    }

    res.set('Content-Type', contentType);
    res.set('Content-Disposition', 'inline');

    await new Promise(
      (resolve, reject) => pipeline(
        stream,
        res,
        err => (err ? reject(err) : resolve()),
      ),
    );
  }

  @Post('/')
  @Returns(200, { type: Array })
  @Returns(415, { description: 'Unsupported file type' })
  @Returns(500, { description: 'Internal server error' })
  public async uploadFile(
    @MultipartFile('files', 10) tempFiles: Express.Multer.File[],
    @BodyParams('location') location: string,
  ): Promise<ResResult<MediaFile[]>> {
    console.log('TEMP FILES', tempFiles);
    if (!tempFiles) {
      throw new UnsupportedMediaType('Unsupported file type');
    }
    const promises = [];
    for (let i = 0; i < tempFiles.length; i += 1) {
      promises.push(this.mediaFileService.moveUploadedFile(tempFiles[i], location));
    }
    let [error, result] = await Promise.all(promises);

    if (error !== null) {
      throw new InternalServerError(error.message);
    }

    [error, result] = await to(this.mediaFileRepository.create(result));
    if (error !== null) {
      throw new InternalServerError(error.message);
    }

    return {
      error: false,
      data: result,
    };
  }

  @Get('/download/:id')
  @Returns(200, { description: 'File contents' })
  @Returns(404, { description: 'File not found' })
  public async getMediaDownload(
    @Req() req: Request,
    @Res() res: Response,
    @PathParams('id') id: number,
  ): Promise<void> {
    return this.download(res, id);
  }

  @Get('/download/:id/*')
  @Returns(200, { description: 'File contents' })
  @Returns(404, { description: 'File not found' })
  public async getMediaDownloadWithCheckPath(
    @Req() req: Request,
    @Res() res: Response,
    @PathParams('id') id: number,
  ): Promise<void> {
    const filePath = req.params[0];
    return this.download(res, id, filePath);
  }

  @Get('/list')
  @Returns(200, { type: Array })
  public async listFiles(
  ): Promise<ResSuccess<MediaFile[]>> {
    const files = await this.mediaFileRepository.find();
    return {
      error: null,
      data: files,
    };
  }

  @Delete('/:id')
  @Returns(200, { type: Boolean })
  @Returns(404, { description: 'File not found' })
  public async deleteFile(
    @Required @PathParams('id') id: number,
  ): Promise<ResSuccess<boolean>> {
    const file = await this.mediaFileRepository.findOne(id);
    if (!file) {
      throw new NotFound('File not found');
    }
    const [error, result] = await to(this.mediaFileService.unlinkMediaFile(file.path));
    if (error) {
      return {
        error: error.message,
        data: null,
      };
    }
    await this.mediaFileRepository.remove([file]);
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

  @Get('/thumbnail/:format/:width/:id')
  @Returns(404, { description: 'File not found' })
  public async getMediaThumbnail(
    @PathParams('format') format: 'png' | 'pjpeg',
    @PathParams('width') width: number,
    @PathParams('id') id: number,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return this.getThumb(res, id, format, width);
  }

  @Get('/thumbnail/:format/:width/:id/*')
  @Returns(404, { description: 'File not found' })
  public async getMediaThumbnailWithCheckPath(
    @PathParams('format') format: 'png' | 'pjpeg',
    @PathParams('width') width: number,
    @PathParams('id') id: number,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const filePath = req.params[0];
    return this.getThumb(res, id, format, width, filePath);
  }
}
