import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { StorageAmazonS3 } from '../src/StorageAmazonS3';
import { StorageGoogleCloud } from '../src/StorageGoogleCloud';
import { StorageLocal } from '../src/StorageLocal';
import { IStorage } from '../src/types';
dotenv.config();

const configS3 = {
  // bucketName: process.env.STORAGE_BUCKETNAME,
  accessKeyId: process.env.STORAGE_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_AWS_SECRET_ACCESS_KEY,
};
const configGoogle = {
  // bucketName: process.env.STORAGE_BUCKETNAME,
  projectId: process.env.STORAGE_GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.STORAGE_GOOGLE_CLOUD_KEYFILE,
};
const configLocal = {
  // bucketName: process.env.STORAGE_BUCKETNAME,
  directory: process.env.STORAGE_LOCAL_DIRECTORY,
};

const test = async (storage: IStorage) => {
  let r: any;

  r = await storage.listBuckets();
  console.log('list buckets', r);

  r = await storage.createBucket('fnaap1');
  r = await storage.createBucket('fnaap2');
  r = await storage.createBucket('fnaap3');

  r = await storage.listBuckets();
  console.log('list buckets', r);

  r = await storage.deleteBucket('fnaap3');

  r = await storage.listBuckets();
  console.log('list buckets', r);

  try {
    await storage.addFileFromPath('./tests/data/image1.jpg', 'subdir/sub subdir/new name.jpg');
  } catch (e) {
    console.log(e.message);
  }

  r = await storage.selectBucket('fnaap1');
  r = await storage.addFileFromPath('./tests/data/image1.jpg', 'subdir/sub subdir/new name.jpg');

  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  r = await storage.listFiles();
  console.log('list files', r);

  r = await storage.clearBucket();

  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  r = await storage.listFiles();
  console.log('list files', r);

  await storage.addFileFromPath('./tests/data/image1.jpg', 'subdir/sub subdir/new name.jpg');
  r = await storage.listFiles();
  console.log('add file', r);

  await storage.removeFile('subdir/sub-subdir/new-name.jpg');
  r = await storage.listFiles();
  console.log('remove file', r);

  await storage.addFileFromPath('./tests/data/image1.jpg', 'tmp.jpg');

  r = await new Promise(async (resolve, reject): Promise<void> => {
    const readStream = await storage.getFileAsReadable('tmp.jpg');
    const p = path.join(__dirname, 'test.jpg');
    // console.log(p);
    const writeStream = fs.createWriteStream(p);
    readStream.on('end', resolve);
    readStream.on('error', reject);
    writeStream.on('error', reject);
    // writeStream.on('finish', () => { console.log('write finished'); });
    readStream.pipe(writeStream);
  });
  console.log('readstream error:', typeof r !== 'undefined');

  r = await storage.deleteBucket('fnaap1');
  r = await storage.deleteBucket('fnaap2');
};

// const storage = new StorageLocal(configLocal);
// const storage = new StorageAmazonS3(configS3);
const storage = new StorageGoogleCloud(configGoogle);
// storage.listBuckets().then(data => { console.log(data); });
test(storage);
