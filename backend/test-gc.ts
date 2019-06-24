import dotenv from 'dotenv';
import { StorageGoogle } from './StorageGoogle';
dotenv.config();

const bucketName = 'aap-en-beer';

const configGoogle = {
  bucketName,
  projectId: 'default-demo-app-35b34',
  keyFilename: './da2719acad70.json',
}


const createBucket = async () => {
  const gc = new StorageGoogle(configGoogle);
  const d = await gc.createBucket()
  console.log(d);
}
// createBucket();


const getFiles = async () => {
  const gc = new StorageGoogle(configGoogle);
  const d = await gc.listFiles()
  console.log(d);
}
getFiles();


const addFileFromPath = async (path: string, newFileName?: string) => {
  const gc = new StorageGoogle(configGoogle);
  const d = await gc.addFileFromPath(path, newFileName)
  console.log(d);
}
// addFileFromPath('/home/abudaan/Pictures/sun-blanket.jpg', 'aapenbeer.jpg')


const removeFile = async (fileName: string) => {
  const gc = new StorageGoogle(configGoogle);
  const d = await gc.removeFile(fileName)
  console.log(d);
}
// removeFile('aapenbeer.jpg')


// const getFile = async (fileName: string) => {
//   const gc = new StorageGoogle(configGoogle);
//   const d = await gc.getFile(fileName)
//   console.log(d);
// }
// getFile('sun-blanket.jpg')


const downloadFile = async (fileName: string) => {
  const gc = new StorageGoogle(configGoogle);
  const r = await gc.downloadFile(fileName, '/home/abudaan/Downloads/')
  console.log('R', r);
}
// downloadFile('sun-blanket.jpg')