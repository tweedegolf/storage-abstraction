import { Service } from '@tsed/di';
import { MediaFile } from '../entities/MediaFile';

import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import slugify from 'slugify';
import {
  getMediaStorageMethod,
  getLocalMediaStorageRoot,
  getGoogleCloudBucket,
  getGoogleCloudProjectId,
  getGoogleCloudKeystorePath,
} from "../env";

export enum MediaStorageMethod {
  Local = 'local',
  GoogleCloud = 'google-cloud',
}

// import { MediaStorageMethod } from "../types";
import { Readable } from 'stream';
import { fileExists, isSubfolder, mkdir, unlink, stat } from "../util/file";

@Service()
export class MediaFileService {
  public static getMediaFilePath = (filePath: string) => path.join(getLocalMediaStorageRoot(), filePath);

  private static getNewFilePath(filename, originalName, dir: string): string {
    const slug = slugify(`${filename}_${originalName}`).toLowerCase();
    return path.join(dir, slug);
  }

  private storage: Storage;
  private bucket: string;

  constructor() {
    if (getMediaStorageMethod() === MediaStorageMethod.GoogleCloud) {
      this.storage = new Storage({
        projectId: getGoogleCloudProjectId(),
        keyFilename: getGoogleCloudKeystorePath(),
      });

      this.bucket = getGoogleCloudBucket();
    }
  }

  public async moveUploadedFile(tempFile: Express.Multer.File, dir: string): Promise<MediaFile> {
    const filePath = tempFile.path;
    const fileSize = (await stat(filePath)).size;
    const originalName = path.basename(filePath);

    const newName = await this.copyFile(filePath, originalName, dir);
    await unlink(tempFile.path);
    return this.instanceMediaFile({ fileSize, originalName, newName });
  }

  public async copyFixtureFile(filePath: string, dir: string): Promise<MediaFile> {
    const fileSize = (await stat(filePath)).size;
    const originalName = path.basename(filePath);

    const newName = await this.copyFile(filePath, originalName, dir);
    return this.instanceMediaFile({ fileSize, originalName, newName });
  }

  public async copyFile(filePath: string, originalName: string, dir: string) {
    const fileName = path.basename(filePath);
    const newName = MediaFileService.getNewFilePath(fileName, originalName, dir);

    const f = () => {
      if (getMediaStorageMethod() === MediaStorageMethod.Local) {
        return this.storeFileLocally(filePath, newName);
      } else if (getMediaStorageMethod() === MediaStorageMethod.GoogleCloud) {
        return this.storeFileGoogleCloud(filePath, newName);
      } else {
        // TODO Error should be thrown in env.ts
        throw new Error("Logic error");
      }
    };

    await f();

    return newName;
  }

  public async getMediaFileReadStream(file: MediaFile): Promise<{ success: boolean, stream?: Readable }> {
    return this.getFileReadStream(file.path);
  }

  public async getFileReadStream(filePath: string): Promise<{ success: boolean, stream?: Readable }> {
    const uploadDir = getLocalMediaStorageRoot();
    const downloadPath = path.join(uploadDir, filePath);

    if (!isSubfolder(uploadDir, downloadPath)) {
      throw new Error(`Can only get files from upload directory and subdirectories`);
    }

    if (getMediaStorageMethod() === MediaStorageMethod.Local) {
      if (!await fileExists(downloadPath)) {
        return { success: false };
      }

      return {
        success: true,
        stream: fs.createReadStream(downloadPath),
      };
    } else if (getMediaStorageMethod() === MediaStorageMethod.GoogleCloud) {
      const bucket = this.storage.bucket(this.bucket);
      const file = bucket.file(filePath);
      if (!file.exists()) {
        return { success: false };
      }

      return {
        success: true,
        stream: file.createReadStream(),

      };
    } else {
      // TODO Error should be thrown in env.ts
      throw new Error("Logic error");
    }
  }

  public async unlinkMediaFile(file: MediaFile): Promise<void> {
    if (getMediaStorageMethod() === MediaStorageMethod.Local) {
      const fullPath = getLocalMediaStorageRoot() + path.sep + file.path;
      await unlink(fullPath);
    } else if (getMediaStorageMethod() === MediaStorageMethod.GoogleCloud) {
      await this.storage.bucket(this.bucket).file(file.path).delete();
    }
  }

  private instanceMediaFile(props): MediaFile {
    const { fileSize, originalName, newName } = props;

    const file = new MediaFile();
    file.size = fileSize;
    file.name = originalName;
    file.path = newName;

    return file;
  }

  private async storeFileLocally(filePath: string, newName: string): Promise<void> {
    const uploadDir = getLocalMediaStorageRoot();
    const newPath = path.join(uploadDir, newName);

    if (!isSubfolder(uploadDir, newPath)) {
      throw new Error(`Can only store files in upload directory and subdirectories`);
    }

    await mkdir(path.dirname(newPath), { recursive: true });

    await new Promise((resolve, reject) => {
      fs.copyFile(
        filePath,
        newPath,
        (err) => err ? reject(err) : resolve());
    });
  }

  private storeFileGoogleCloud(filePath: string, newName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(filePath);

      const writeStream = this.storage.bucket(this.bucket).file(newName).createWriteStream();
      readStream.on('end', resolve);
      readStream.on('error', reject);
      readStream.pipe(writeStream);
    });
  }
}
