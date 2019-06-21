import dotenv from 'dotenv';
import StorageS3 from './AmazonS3';
import StorageGoogle from './GoogleCloud';
dotenv.config();

const configS3 = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
}

const configGoogle = {
  projectId: 'default-demo-app-35b34',
  keyFilename: './da2719acad70.json',
}

const getFilesInBucket1 = async () => {
  const s3 = new StorageS3(configS3);
  const d = await s3.getFilesInBucket('aap-en-beers')
  console.log(d);
}
// getFilesInBucket1();



const createBucket = async () => {
  const gc = new StorageGoogle(configGoogle);
  const d = await gc.createBucket('aap-en-beers')
  console.log(d);
}
// createBucket();


// getFilesInBucket();
const getFilesInBucket = async () => {
  const gc = new StorageGoogle(configGoogle);
  const d = await gc.getFilesInBucket('aap-en-beers')
  console.log(d);
}
// getFilesInBucket();


const listBucketNames = async () => {
  const gc = new StorageGoogle(configGoogle);
  const d = await gc.listBucketNames()
  console.log(d);
}
listBucketNames();
