import fs from 'fs';
import os from 'os';
import path from 'path';
import rimraf from 'rimraf';
import slugify from 'slugify';
import dotenv from 'dotenv';
import { Storage } from '../src/Storage';
import to from 'await-to-js';
import 'jasmine';
import { IStorage, StorageConfig } from '../src/types';
dotenv.config();

const type = process.env['TYPE'];
if (!type) {
  process.exit(1);
}
// const type = Storage.TYPE_LOCAL;
// const type = Storage.TYPE_GOOGLE_CLOUD;
// const type = Storage.TYPE_AMAZON_S3;
let storage: IStorage;
let config: StorageConfig;
const localDir = __dirname;
const bucketName = process.env.STORAGE_BUCKETNAME;

if (type === Storage.TYPE_LOCAL) {
  config = {
    bucketName,
    // directory: process.env.STORAGE_LOCAL_DIRECTORY,
    directory: localDir,
  };
} else if (type === Storage.TYPE_GOOGLE_CLOUD) {
  config = {
    bucketName,
    projectId: process.env.STORAGE_GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: process.env.STORAGE_GOOGLE_CLOUD_KEYFILE,
  };
} else if (type === Storage.TYPE_AMAZON_S3) {
  config = {
    bucketName,
    accessKeyId: process.env.STORAGE_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_AWS_SECRET_ACCESS_KEY,
  };
}

storage = new Storage(config);

describe(`testing ${type} storage`, () => {

  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  afterAll(async () => {
    // fs.promises.stat('tmp.jpg')
    //   .then(() => fs.promises.unlink('tmp.jpg'))
    //   .catch(e => {
    //     throw e;
    //   });
    if (type === Storage.TYPE_LOCAL) {
      await new Promise((resolve, reject) => {
        fs.promises.unlink(path.join(localDir, 'test.jpg'));
        rimraf(path.join(localDir, slugify(bucketName)), (e: Error) => {
          if (e) {
            throw e;
          } else {
            resolve();
          }
        });
      });
    }
  });

  it('test', async () => {
    try {
      await storage.test();
    } catch (e) {
      console.error(e);
      return;
    }
  });

  it('create bucket', async () => {
    await expectAsync(storage.createBucket(bucketName)).toBeResolved();
  });

  it('clear bucket', async () => {
    await expectAsync(storage.clearBucket()).toBeResolved();
  });

  it('add file success', async () => {
    await expectAsync(storage.addFileFromPath('./tests/data/image1.jpg', 'image1.jpg')).toBeResolved();
  });

  it('add file error', async () => {
    await expectAsync(storage.addFileFromPath('./tests/data/non-existent.jpg', 'non-existent.jpg')).toBeRejected();
  });

  it('add with new name and dir', async () => {
    // const [err, result] = await to(storage.addFileFromPath('./tests/data/image1.jpg', {
    //   dir: 'subdir',
    //   name: 'renamed.jpg',
    // }));

    await expectAsync(storage.addFileFromPath('./tests/data/image1.jpg', 'subdir/renamed.jpg')).toBeResolved();
  });

  // it('wait a bit', async () => {
  //   await new Promise((resolve) => {
  //     setTimeout(resolve, 1000);
  //   });
  // });

  it('list files 1', async () => {
    const expectedResult: [string, number][] = [['image1.jpg', 32201], ['subdir/renamed.jpg', 32201]];
    await expectAsync(storage.listFiles()).toBeResolvedTo(expectedResult);
  });

  it('remove file success', async () => {
    // const [err, result] = await to(storage.removeFile('subdir/renamed.jpg'));
    // console.log(err, result);
    await expectAsync(storage.removeFile('subdir/renamed.jpg')).toBeResolved();
  });

  it('remove file again', async () => {
    await expectAsync(storage.removeFile('subdir/renamed.jpg')).toBeResolved();
  });

  it('list files 2', async () => {
    const expectedResult: [string, number][] = [['image1.jpg', 32201]];
    await expectAsync(storage.listFiles()).toBeResolvedTo(expectedResult);
  });

  it('get readable stream', async () => {
    await expectAsync(storage.getFileAsReadable('image1.jpg')).toBeResolved();
  });

  it('get readable stream error', async () => {
    await expectAsync(storage.getFileAsReadable('image2.jpg')).toBeRejected();
  });

  it('get readable stream and save file', async () => {
    try {
      const readStream = await storage.getFileAsReadable('image1.jpg');
      const filePath = path.join(localDir, 'test.jpg');
      const writeStream = fs.createWriteStream(filePath);
      await new Promise((resolve, reject) => {
        readStream
          .pipe(writeStream)
          .on('error', (e: Error) => {
            // console.log('read', e.message);
            reject();
          })
          .on('finish', () => {
            // console.log('read finish');
            resolve();
          });

        writeStream
          .on('error', (e: Error) => {
            // console.log('write', e.message);
            reject();
          })
          .on('finish', () => {
            // console.log('write finish');
            resolve();
          });
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
});
