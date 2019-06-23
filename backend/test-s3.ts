import dotenv from 'dotenv';
import StorageS3 from './StorageS3';
dotenv.config();

const bucketName = 'aap-en-beer';

const configS3 = {
  bucketName,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
}

const getFiles = async () => {
  const s3 = new StorageS3(configS3);
  const d = await s3.getFiles()
  console.log(d);
}
getFiles();


const addFileFromPath = async (path: string, newFileName?: string) => {
  const s3 = new StorageS3(configS3);
  const d = await s3.addFileFromPath(path, newFileName)
  console.log(d);
}
// addFileFromPath('/home/abudaan/Pictures/sun-blanket.jpg', 'aapenbeer.jpg')


const removeFile = async (fileName: string) => {
  const s3 = new StorageS3(configS3);
  const d = await s3.removeFile(fileName)
  console.log(d);
}
// removeFile('aapenbeer.jpg')



