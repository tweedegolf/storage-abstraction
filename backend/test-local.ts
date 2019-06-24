import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { StorageLocal } from './StorageLocal';
import to from 'await-to-js';
dotenv.config();

const bucketName = 'aap-en-beer';

const configLocal = {
  bucketName,
  directory: '/home/abudaan/Downloads'
}

const sl = new StorageLocal(configLocal);

const createBucket = async () => {
  const d = await sl.createBucket()
  console.log(d);
}
// createBucket();


// const listFiles = async () => {
//   const d = await sl.listFiles()
//   console.log(d);
// }
// listFiles();

// const removeFile = async (file: string) => {
//   const d = await sl.removeFile(file)
//   console.log(d);
// }
// removeFile('tmp.jpg');


const addFileFromPath = async (file: string) => {
  const [err, result] = await to(sl.addFileFromPath(file))
  if (err) {
    console.error(err.message);
  } else {
    console.log(result);
  }
}
// addFileFromPath('/home/abudaan/Downloads/SH-3-44.mid');
// addFileFromPath('/home/abudaan/Downloads/surfaces-smooth.jpg');


const getFileAsReadable = (fileName: string) => {
  sl.getFileAsReadable(fileName)
    .then(readStream => {
      const filePath = path.join('/home/abudaan/Downloads/tmp/', fileName);
      const writeStream = fs.createWriteStream(filePath);
      readStream.pipe(writeStream);
      writeStream.on('error', (e: Error) => {
        console.log(e.message);
      })
      writeStream.on('finish', () => {
        console.log('FINISHED');
      })
    })
    .catch(e => { console.log(e) })
}
getFileAsReadable('SH-3-44.mid');
// getFileAsReadable('IMG_9643.jpg');



