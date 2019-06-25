import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv';
import { StorageGoogleCloud } from '../StorageGoogleCloud';
dotenv.config();

const bucketName = 'aap-en-beer';
const configGoogle = {
  bucketName,
  projectId: 'default-demo-app-35b34',
  keyFilename: './da2719acad70.json',
}
const gc = new StorageGoogleCloud(configGoogle);

const createBucket = async () => {
  const d = await gc.createBucket()
  console.log(d);
}
// createBucket();


const listFiles = async () => {
  const d = await gc.listFiles()
  console.log(d);
}
// listFiles();


const addFileFromPath = async (path: string, newFileName?: string) => {
  const d = await gc.addFileFromPath(path, { name: newFileName })
  console.log(d);
}
// addFileFromPath('/home/abudaan/Pictures/sun-blanket.jpg', 'test/aapenbeer.jpg')


const removeFile = async (fileName: string) => {
  const d = await gc.removeFile(fileName)
  console.log(d);
}
removeFile('aapenbeer.jpg')


// const getFile = async (fileName: string) => {
//   const gc = new StorageGoogle(configGoogle);
//   const d = await gc.getFile(fileName)
//   console.log(d);
// }
// getFile('sun-blanket.jpg')


const downloadFile = async (fileName: string) => {
  const r = await gc.downloadFile(fileName, '/home/abudaan/Downloads/')
  console.log('R', r);
}
// downloadFile('sun-blanket.jpg')

const getFileAsReadable = (fileName: string) => {
  gc.getFileAsReadable(fileName)
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
    .catch(e => { console.log(e.message) })
}
// getFileAsReadable('generate_error/SH-3-44.mid');