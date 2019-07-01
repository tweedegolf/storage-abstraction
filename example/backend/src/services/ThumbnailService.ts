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

  // async $onInit(): Promise<boolean> {
  //   try {
  //   } catch (e) {
  //     throw e;
  //   }
  //   return true;
  // }

  private async _createThumbnail(options: Options, readStream: Readable, savePath: string) {
    let generator: any;
    if (options.format === 'pjpeg') {
      generator = (image: sharp.Sharp) => image.jpeg({ quality: 70, progressive: true });
    } else if (options.format === 'png') {
      generator = (image: sharp.Sharp) => image.png();
    }

    await fs.promises.mkdir(path.dirname(savePath), { recursive: true });
    const resizeStream = generator(sharp()
      .resize(options.width));
    const writeStream = fs.createWriteStream(savePath);

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
      await fs.promises.unlink(savePath);
      throw e;
    }
  }

  public async createThumbnail(filePath: string, options: Options, _cachedFilePath?: string) {
    let cachedFilePath = _cachedFilePath;
    if (typeof cachedFilePath === 'undefined') {
      cachedFilePath = this.getCachePath(filePath, options);
    }
    await this._createThumbnail(options, fs.createReadStream(filePath), cachedFilePath);
  }

  private getCachePath(filePath: string, options: Options): string {
    const key = digest(JSON.stringify({ ...options, filePath }));
    return path.join(getMediaThumbnailCacheDir(), key);
  }

  public async getThumbnailReadStream(filePath: string, options: Options):
    Promise<{ success: boolean; contentType?: string; stream?: Readable }> {

    const contentType = (() => {
      if (options.format === 'png') {
        return 'image/png';
      }
      if (options.format === 'pjpeg') {
        return 'image/jpeg';
      }
      throw new Error('Unsupported format');
    })();

    const cachedFilePath = this.getCachePath(filePath, options);
    const [error, result] = await to(fs.promises.stat(cachedFilePath));

    if (error !== null) {
      const [error, readStream] = await to(this.mediaFileService.getFileReadStream(filePath));
      if (error !== null) {
        throw error;
      }
      await this._createThumbnail(options, readStream, cachedFilePath);
    } else {
      console.log('GET THUMBNAIL FROM CACHE');
    }

    return {
      contentType,
      success: true,
      stream: fs.createReadStream(cachedFilePath),
      // stream: fs.createReadStream('./media/cache/14cec936c762a70845afe1e37603753c5d8facbb31f047f59a761d9ad0fc0590'),
    };
  }
}
