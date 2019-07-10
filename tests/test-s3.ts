import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { StorageAmazonS3 } from '../src/StorageAmazonS3';
import { StorageGoogleCloud } from '../src/StorageGoogleCloud';
import { StorageLocal } from '../src';
dotenv.config();

const bucketName = 'the buck';
const configS3 = {
  bucketName,
  accessKeyId: process.env.STORAGE_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_AWS_SECRET_ACCESS_KEY,
};
const configGoogle = {
  bucketName,
  projectId: process.env.STORAGE_GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.STORAGE_GOOGLE_CLOUD_KEYFILE,
};
const configLocal = {
  bucketName: process.env.STORAGE_BUCKETNAME,
  directory: process.env.STORAGE_LOCAL_DIRECTORY,
};

// const storage = new StorageAmazonS3(configS3);
// const storage = new StorageGoogleCloud(configGoogle);
const storage = new StorageLocal(configLocal);

const createBucket = async (name: string) => {
  const d = await storage.createBucket(name);
  console.log(d);
};
// createBucket('aap3')
//   .then(() => {
//     createBucket('aap3');
//   })
//   .catch(e => {
//     console.log(e);
//   });

const deleteBucket = async (name?: string) => {
  const d = await storage.deleteBucket(name);
  console.log(d);
};
// deleteBucket()
//   .then(() => {
//     deleteBucket();
//   });

const selectBucket = async (name: string) => {
  const d = await storage.selectBucket(name);
  console.log(d);
};
// selectBucket('aap1')
//   .then(() => {
//     selectBucket('aap2');
//   })
//   .then(() => {
//     storage.addFileFromPath('./tests/data/image1.jpg', 'subdir/sub subdir/new name.jpg');
//   });

const clearBucket = async () => {
  const d = await storage.clearBucket();
  console.log(d);
};
// clearBucket();

const listBuckets = async () => {
  const d = await storage.listBuckets();
  console.log(d);
};
listBuckets();

const listFiles = async () => {
  const d = await storage.listFiles();
  console.log(d);
};
// listFiles();

const getFileAsReadable = (fileName: string) => {
  storage.getFileAsReadable(fileName)
    .then((readStream) => {
      const filePath = path.join(os.tmpdir(), fileName);
      const writeStream = fs.createWriteStream(filePath);
      readStream.pipe(writeStream);
      writeStream.on('error', (e: Error) => {
        throw e;
      });
      writeStream.on('finish', () => {
        console.log('FINISHED');
      });
    })
    .catch((e) => {
      console.log('JUST A NEAT ERROR', e);
    });
};
// getFileAsReadable('image1.jpg');
// getFileAsReadable('/generate_error/non_existent.jpg');

const getFileAsReadable2 = async (fileName: string) => {
  const readStream = await storage.getFileAsReadable(fileName)
    .catch((e) => { console.log(e); });

  if (!readStream) {
    return;
  }
  console.log(readStream);
  const filePath = path.join(os.tmpdir(), fileName);
  const writeStream = fs.createWriteStream(filePath);
  readStream.pipe(writeStream);
  writeStream.on('error', (e: Error) => {
    console.log(e.message);
  });
  writeStream.on('finish', () => {
    console.log('FINISHED');
  });
};
// getFileAsReadable2('image1.jpg');

const getFileAsReadable3 = async (fileName: string) => {
  const readStream = await storage.getFileAsReadable(fileName);
  if (readStream !== null) {
    const filePath = path.join(os.tmpdir(), fileName);
    const writeStream = fs.createWriteStream(filePath);
    readStream.pipe(writeStream);
    writeStream.on('error', (e: Error) => {
      console.log(e.message);
    });
    writeStream.on('finish', () => {
      console.log('FINISHED');
    });
  }
};
// getFileAsReadable3('image1.jpg');

const addFileFromPath = async (path: string, targetPath: string) => {
  const d = await storage.addFileFromPath(path, targetPath);
  console.log(d);
};
// addFileFromPath('./tests/data/image1.jpg', 'subdir/sub subdir/new name.jpg');
// addFileFromPath('./tests/data/image1.jpg', 'subdir/new name.jpg');

const removeFile = async (fileName: string) => {
  // try {
  //   const d = await storage.removeFile(fileName)
  //   console.log(d);
  // } catch (e) {
  //   console.log('error');
  // }
  storage.removeFile(fileName)
    .then((d) => {
      console.log(d);
    })
    .catch((e: Error) => {
      console.log(e);
    });

};
// removeFile('subdir/sub-subdir/new-name.jpg');
