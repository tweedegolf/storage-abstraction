import awaitToJs from 'await-to-js';
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

  public async getThumbnailReadStream(filePath: string, options: Options):
    Promise<{ success: boolean; contentType?: string; stream?: Readable }> {
    const { contentType, generator } = await (() => {
      switch (options.format) {
        case 'pjpeg':
          return {
            contentType: 'image/jpeg',
            generator: (image: sharp.Sharp) => image.jpeg({ quality: 70, progressive: true }),
          };
        case 'png':
          return {
            contentType: 'image/png',
            generator: (image: sharp.Sharp) => image.png(),
          };
        default:
          throw new Error('Unsupported format');
      }
    })();

    const key = digest(JSON.stringify({ ...options, filePath }));
    const cachedFilePath = path.join(getMediaThumbnailCacheDir(), key);
    const [error, result] = await awaitToJs(fs.promises.stat(cachedFilePath));

    if (error !== null) {
      await fs.promises.mkdir(path.dirname(cachedFilePath), { recursive: true });

      const [error, readStream] = await awaitToJs(this.mediaFileService.getFileReadStream(filePath));

      if (error !== null) {
        return { success: false };
      }

      const resizeStream = generator(sharp()
        .resize(options.width));

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
    }

    return {
      contentType,
      success: true,
      stream: fs.createReadStream(cachedFilePath),
    };
  }
}
