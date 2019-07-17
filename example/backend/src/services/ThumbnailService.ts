import to from 'await-to-js';
import { Service } from '@tsed/di';
import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { Readable, pipeline } from 'stream';
import { getMediaThumbnailCacheDir } from '../env';
import { MediaFileService } from './MediaFileService';

interface Options {
  width: number;
  format: 'pjpeg' | 'png';
}

const digest = (str: string) => crypto.createHash('sha256').update(str).digest('hex');

@Service()
export class ThumbnailService {
  public constructor(private mediaFileService: MediaFileService) {
  }

  private getCachePath(filePath: string, options: Options): string {
    const key = digest(JSON.stringify({ ...options, filePath }));
    return path.join(getMediaThumbnailCacheDir(), key);
  }

  private getGenerator(options: Options): [string, (img: sharp.Sharp) => sharp.Sharp] {
    if (options.format === 'png') {
      return [
        'image/png',
        (image: sharp.Sharp) => image.png(),
      ];
    }
    if (options.format === 'pjpeg') {
      return [
        'image/jpeg',
        (image: sharp.Sharp) => image.jpeg({ quality: 70, progressive: true }),
      ];
    }
    throw new Error('Unsupported format');
  }

  public async getThumbnailReadStream(filePath: string, options: Options):
    Promise<{ success: boolean; contentType?: string; stream?: Readable }> {

    const [contentType, generator] = this.getGenerator(options);
    const cachedFilePath = this.getCachePath(filePath, options);
    const [error] = await to(fs.promises.stat(cachedFilePath));

    if (error !== null) {
      // console.log('create new thumbnail');
      const [error, readStream] = await to(this.mediaFileService.getFileReadStream(filePath));
      if (error !== null) {
        throw error;
      }

      await fs.promises.mkdir(path.dirname(cachedFilePath), { recursive: true });
      const resizeStream = generator(sharp().resize(options.width));
      const writeStream = fs.createWriteStream(cachedFilePath);

      try {
        await new Promise(
          (resolve, reject) => pipeline(
            readStream,
            resizeStream,
            writeStream,
            err => (err ? reject(err) : resolve()),
          ),
        );
      } catch (e) {
        await fs.promises.unlink(cachedFilePath);
        throw e;
      }
    } else {
      // console.log('get thumbnail from cache');
    }

    return {
      contentType,
      success: true,
      stream: fs.createReadStream(cachedFilePath),
    };
  }
}
