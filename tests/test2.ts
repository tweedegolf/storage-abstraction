import dotenv from "dotenv";
import fs, { createReadStream } from "fs";
import path from "path";
import { Storage } from "../src/Storage";
import { IStorage, StorageConfig, StorageType } from "../src/types";
import { Readable, Writable } from "stream";
dotenv.config();

/**
 * Below 3 examples of how you can populate a config object using environment variables.
 * Note that you name the environment variables to your liking.
 */
const configB2 = {
  type: StorageType.B2,
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
  bucketName: process.env.STORAGE_BUCKETNAME,
};

const configS3 = {
  type: StorageType.S3,
  accessKeyId: process.env.STORAGE_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_AWS_SECRET_ACCESS_KEY,
  bucketName: process.env.STORAGE_BUCKETNAME,
};

const configGoogle = {
  type: StorageType.GCS,
  projectId: process.env.STORAGE_GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.STORAGE_GOOGLE_CLOUD_KEYFILE,
  bucketName: process.env.STORAGE_BUCKETNAME,
};

const configLocal = {
  type: StorageType.LOCAL,
  directory: process.env.STORAGE_LOCAL_DIRECTORY,
};

/**
 * Utility function that connects a read-stream (from the storage) to a write-stream (to a local file)
 */
const copyFile = (readStream: Readable, writeStream: Writable): Promise<void> =>
  new Promise((resolve, reject) => {
    readStream
      .pipe(writeStream)
      .on("error", e => {
        console.error("\x1b[31m", e, "\n");
        reject();
      })
      .on("finish", () => {
        console.log("read finished");
      });
    writeStream
      .on("error", e => {
        console.error("\x1b[31m", e, "\n");
        reject();
      })
      .on("finish", () => {
        console.log("write finished");
        resolve();
      });
  });

/**
 * A set of tests
 */
const test1 = async (storage: IStorage): Promise<void> => {
  const bucket = storage.getSelectedBucket();

  try {
    await storage.test();
  } catch (e) {
    console.error("\x1b[31m", e, "\n");
    return;
  }

  storage.addFileFromPath("./tests/data/image1.jpg", "image1.jpg");
};

const run = async (): Promise<void> => {
  // const storage = new Storage(`local://tests/tmp slug?mode=600&slug=true`);
  const storage = new Storage(configLocal as StorageConfig);

  // Note that since 1.4 you have to call `init()` before you can make API calls
  try {
    await storage.init();
  } catch (e) {
    console.error("\x1b[31m", e, "\n");
    process.exit(0);
  }

  test1(storage);
};

run();
