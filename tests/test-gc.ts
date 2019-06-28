import fs from 'fs';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
import { StorageGoogleCloud } from '../src/StorageGoogleCloud';
dotenv.config();

const bucketName = 'aap-en-beer';
const configGoogle = {
  bucketName,
  projectId: process.env.STORAGE_GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.STORAGE_GOOGLE_CLOUD_KEYFILE,
};
const gc = new StorageGoogleCloud(configGoogle);

const createBucket = async () => {
  const d = await gc.createBucket();
  console.log(d);
};
// createBucket();

const listFiles = async () => {
  const d = await gc.listFiles();
  console.log(d);
};
listFiles();

const addFileFromPath = async (path: string, newFileName?: string, dir?: string) => {
  const d = await gc.addFileFromPath(path, { dir, name: newFileName });
  console.log(d);
};
addFileFromPath('./tests/data/sun-blanket.jpg', 'aapenbeer.jpg', 'test')

const removeFile = async (fileName: string) => {
  const d = await gc.removeFile(fileName);
  console.log(d);
};
// removeFile('aapenbeer.jpg');

// const getFile = async (fileName: string) => {
//   const gc = new StorageGoogle(configGoogle);
//   const d = await gc.getFile(fileName)
//   console.log(d);
// }
// getFile('sun-blanket.jpg')

const downloadFile = async (fileName: string) => {
  const r = await gc.downloadFile(fileName, os.tmpdir());
  console.log('R', r);
};
// downloadFile('sun-blanket.jpg')

const getFileAsReadable = (fileName: string) => {
  gc.getFileAsReadable(fileName)
    .then((readStream) => {
      // const filePath = path.join(os.tmpdir(), fileName);
      const filePath = 'tmp.jpg';
      const writeStream = fs.createWriteStream(filePath);
      readStream.pipe(writeStream);
      writeStream.on('error', (e: Error) => {
        console.log(e.message);
      });
      writeStream.on('finish', () => {
        console.log('FINISHED');
      });
    })
    .catch((e) => { console.log(e.message); });
};
// getFileAsReadable('image1.jpg');
// getFileAsReadable('generate_error/SH-3-44.mid');
