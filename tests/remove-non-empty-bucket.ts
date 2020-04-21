import dotenv from "dotenv";
import fs, { createReadStream } from "fs";
import path from "path";
import { Storage } from "../src/Storage";
import { IStorage, StorageType } from "../src/types";
import { copyFile } from "./util";
dotenv.config();

/**
 * Below 4 examples of how you can populate a config object using environment variables.
 * Note that you name the environment variables to your liking.
 */
const configS3 = {
  type: StorageType.S3,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucketName: process.env.BUCKET_NAME,
};

const configGCS = {
  type: StorageType.GCS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEYFILE,
  bucketName: process.env.BUCKET_NAME,
};

const configB2 = {
  type: StorageType.B2,
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
  bucketName: process.env.BUCKET_NAME,
};

const configLocal = {
  type: StorageType.LOCAL,
  directory: process.env.LOCAL_DIRECTORY,
};

const test = async (storage: IStorage): Promise<void> => {
  console.log("=>", storage.getType());

  try {
    const msg = await storage.init();
    console.log(`\x1b[32m[init] ${msg}`);
  } catch (e) {
    console.error(`\x1b[31m[init] ${e.message}\n`);
    return;
  }

  try {
    const msg = await storage.addFileFromPath("./tests/data/image1.jpg", "subdir/image1.jpg");
    console.log(`\x1b[32m[addFileFromPath] ${msg}`);
  } catch (e) {
    console.error(`\x1b[31m[addFileFromPath] ${e.message}\n`);
    return;
  }

  try {
    const msg = await storage.deleteBucket();
    console.log(`\x1b[32m[deleteBucket] ${msg}`);
  } catch (e) {
    console.error(`\x1b[31m[deleteBucket] ${e.message}\n`);
    return;
  }

  try {
    const msg = await storage.clearBucket();
    console.log(`\x1b[32m[clearBucket] ${msg}`);
  } catch (e) {
    console.error(`\x1b[31m[clearBucket] ${e.message}\n`);
    return;
  }

  try {
    const msg = await storage.deleteBucket();
    console.log(`\x1b[32m[deleteBucket] ${msg}`);
  } catch (e) {
    console.error(`\x1b[31m[deleteBucket] ${e.message}\n`);
    return;
  }
};

test(new Storage(configB2));
