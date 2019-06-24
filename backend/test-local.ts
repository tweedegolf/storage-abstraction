import dotenv from 'dotenv';
import { StorageLocal } from './StorageLocal';
dotenv.config();

const bucketName = 'aap-en-beer';

const configLocal = {
  bucketName,
  directory: '/home/abudaan/Downloads/tmp/'
}

const sl = new StorageLocal(configLocal);

const createBucket = async () => {
  const d = await sl.createBucket()
  console.log(d);
}
createBucket();


