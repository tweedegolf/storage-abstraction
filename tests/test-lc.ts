import dotenv from 'dotenv';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { StorageLocal } from '../src/StorageLocal';
import rimraf = require('rimraf');
dotenv.config();

// const localDir = path.join(os.homedir(), 'storage-abstraction');
const configLocal = {
  bucketName: process.env.STORAGE_BUCKETNAME,
  directory: process.env.STORAGE_LOCAL_DIRECTORY,
  // directory: localDir,
};

const sl = new StorageLocal(configLocal);

const clearBucket = async () => {
  const d = await sl.clearBucket();
  console.log(d);
};
// clearBucket();

const listFiles = async () => {
  const d = await sl.listFiles();
  console.log(d);
};
listFiles();

const getFileAsReadable = (fileName: string) => {
  sl.getFileAsReadable(fileName)
    .then((readStream) => {
      const filePath = path.join(os.tmpdir(), fileName);
      const writeStream = fs.createWriteStream(filePath);
      readStream.pipe(writeStream);
      writeStream.on('error', (e: Error) => {
        console.log(e.message);
      });
      writeStream.on('finish', () => {
        console.log('FINISHED');
      });
    })
    .catch((e) => { console.log(e); });
};
// getFileAsReadable('sun-blanket.jpg');
// getFileAsReadable('/generate_error/IMG_9643.jpg');

const getFileAsReadable2 = async (fileName: string) => {
  const readStream = await sl.getFileAsReadable(fileName)
    .catch((e: Error) => { console.log(e); });

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
// getFileAsReadable2('sun-blanket.jpg');
// getFileAsReadable2('IMG_9643.jpg');

const getFileAsReadable3 = async (fileName: string) => {
  const readStream = await sl.getFileAsReadable(fileName);
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
// getFileAsReadable3('sun-blanket.jpg');
// getFileAsReadable3('IMG_9643.jpg');

const addFileFromPath = async (path: string, newFileName?: string, dir?: string) => {
  const d = await sl.addFileFromPath(path, { dir, name: newFileName });
  console.log(d);
  rimraf(configLocal.directory, (e: Error) => {
    if (e) {
      throw e;
    }
  });
};
// addFileFromPath('./tests/data/sun-blanket.jpg', 'aapenbeer.jpg', 'subdir');

const removeFile = async (fileName: string) => {
  // try {
  //   const d = await sl.removeFile(fileName)
  //   console.log(d);
  // } catch (e) {
  //   console.log('error');
  // }
  sl.removeFile(fileName)
    .then((d) => {
      console.log(d);
    })
    .catch((e) => {
      console.log(e);
    });

};
// removeFile('subdir/renamed.jpg');
// removeFile('aapenbeer.jpg')
