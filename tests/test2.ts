import dotenv from "dotenv";
import fs, { createReadStream } from "fs";
import path from "path";
import { Storage } from "../src/Storage";
import { IStorage, StorageType } from "../src/types";
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
  bucketName: process.env.BUCKET_NAME,
};

const configS3 = {
  type: StorageType.S3,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  // bucketName: process.env.BUCKET_NAME,
  bucketName: "null",
  options: {
    region: "eu-west-1",
  },
};

const configGoogle = {
  type: StorageType.GCS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEYFILE,
  bucketName: process.env.BUCKET_NAME,
};

const configLocal = {
  type: StorageType.LOCAL,
  directory: process.env.LOCAL_DIRECTORY,
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

/**
 * Another set of tests
 */
const tests2 = async (storage: IStorage): Promise<void> => {
  let i = 1;
  console.log(i++, "type", storage.getType());
  const bucket = storage.getSelectedBucket();
  console.log(i++, "select bucket", bucket);

  try {
    const readStream = createReadStream(path.join("tests", "data", "image1.jpg"));
    await storage.addFileFromReadable(readStream, "/test.jpg");
    console.log(i++, "add file");
  } catch (e) {
    console.error("\x1b[31m", e, "\n");
  }
  let files = await storage.listFiles();
  console.log(i++, "list files", files);

  await storage.clearBucket();
  console.log(i++, "clear bucket");

  files = await storage.listFiles();
  console.log(i++, "list files", files);
};

/**
 * Another set of tests
 */
const tests3 = async (storage: IStorage): Promise<void> => {
  let i = 1;
  console.log(i++, "type", storage.getType());

  await storage.createBucket("test mode");
};

const testParam = (name = "default"): void => {
  console.log(name);
};

const testParam2 = (name?: string): void => {
  console.log(name || "default");
};

const testPromise = (name?: string): Promise<string> => {
  if (name) {
    return Promise.resolve(name);
  }
  return Promise.reject("please provide a name");
};

const testPromise2 = async (name?: string): Promise<string> => {
  const n = await testPromise(name);
  return n;
};

const run = async (): Promise<void> => {
  /*  
  testParam();
  testParam("");
  testParam(null);
  testParam("null");
  console.log("----");
  testParam2();
  testParam2("");
  testParam2(null);
  testParam2("null");
  console.log("---");
  let r = await testPromise(null).catch(e => {
    console.log(e);
  });
  console.log(r);
  r = await testPromise("a name");
  console.log(r);
  testPromise2(null).catch(e => {
    console.log(e);
  });
  */

  let storage: Storage;
  try {
    // storage = new Storage(`local://tests/tmp slug?mode=600&slug=true`);
    // storage = new Storage(`foo://tests/tmp slug?mode=600&slug=true`);
    // storage = new Storage(`b2://tests/tmp slug?mode=600&slug=true`);
    // storage = new Storage(`b2f://key_id/key?bucketName=bucket`);
    // storage = new Storage(configS3);
    storage = new Storage(configGoogle);
    const c = storage.getConfiguration();
  } catch (e) {
    console.error(`\x1b[31m${e.message}\n`);
    process.exit(0);
  }

  // Note that since 1.4 you have to call `init()` before you can make API calls
  try {
    await storage.init();
  } catch (e) {
    console.error("\x1b[31m", e, "\n");
    process.exit(0);
  }

  console.log(storage.getConfiguration());

  try {
    await storage.listBuckets();
  } catch (e) {
    console.error("\x1b[31m", e, "\n");
    process.exit(0);
  }

  // try {
  //   await storage.createBucket("paap aap 2");
  // } catch (e) {
  //   console.error("\x1b[31m", e, "\n");
  //   process.exit(0);
  // }

  // test1(storage);
};

run();
