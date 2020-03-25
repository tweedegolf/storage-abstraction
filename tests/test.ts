import dotenv from "dotenv";
import os from "os";
import fs, { createReadStream } from "fs";
import path from "path";
import { Storage } from "../src/Storage";
import { IStorage } from "../src/types";
import { Readable, Writable } from "stream";
dotenv.config();

const copyFile = (readStream: Readable, writeStream: Writable): void => {
  readStream
    .pipe(writeStream)
    .on("error", e => {
      console.error("\x1b[31m", e, "\n");
    })
    .on("finish", () => {
      console.log("read finished");
    });
  writeStream
    .on("error", e => {
      console.error("\x1b[31m", e, "\n");
    })
    .on("finish", () => {
      console.log("write finished");
    });
};

const configS3 = {
  bucketName: process.env.STORAGE_BUCKETNAME,
  accessKeyId: process.env.STORAGE_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_AWS_SECRET_ACCESS_KEY,
};

const configGoogle = {
  bucketName: process.env.STORAGE_BUCKETNAME,
  projectId: process.env.STORAGE_GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.STORAGE_GOOGLE_CLOUD_KEYFILE,
};

const configLocal = {
  bucketName: process.env.STORAGE_BUCKETNAME,
  directory: process.env.STORAGE_LOCAL_DIRECTORY,
};

const test = async (storage: IStorage): Promise<void> => {
  console.log("=>", storage.introspect("type") as string);
  const bucket = storage.introspect("bucketName") as string;

  try {
    await storage.test();
  } catch (e) {
    console.error("\x1b[31m", e, "\n");
    return;
  }

  try {
    await storage.selectBucket(bucket);
    console.log(`select bucket "${bucket}"`);
  } catch (e) {
    console.error("\x1b[31m", e, "\n");
  }

  try {
    const readStream = createReadStream(path.join("tests", "data", "image1.jpg"));
    await storage.addFileFromReadable(readStream, "/test.jpg");
  } catch (e) {
    console.error("\x1b[31m", e, "\n");
  }

  try {
    const readStream = await storage.getFileAsReadable("test.jpg", {
      end: 4000,
    });
    const p = path.join(process.cwd(), "test-partial.jpg");
    const writeStream = fs.createWriteStream(p);
    copyFile(readStream, writeStream);
  } catch (e) {
    console.error("\x1b[31m", e, "\n");
  }
  await fs.promises.unlink(path.join(process.cwd(), "test-partial.jpg"));

  try {
    const readStream = await storage.getFileAsReadable("test.jpg");
    const p = path.join(process.cwd(), "test.jpg");
    const writeStream = fs.createWriteStream(p);
    copyFile(readStream, writeStream);
  } catch (e) {
    console.error("\x1b[31m", e, "\n");
  }
  await fs.promises.unlink(path.join(process.cwd(), "test.jpg"));

  let buckets = await storage.listBuckets();
  console.log("list buckets", buckets);

  await storage.createBucket("bucket-1");
  await storage.createBucket("bucket-2");
  await storage.createBucket("bucket-3");

  buckets = await storage.listBuckets();
  console.log("list buckets", buckets);

  await storage.deleteBucket("bucket-3");

  buckets = await storage.listBuckets();
  console.log("list buckets", buckets);

  try {
    await storage.addFileFromPath("./tests/data/image1.jpg", "subdir/sub subdir/new name.jpg");
  } catch (e) {
    console.log(e.message);
  }

  await storage.selectBucket("bucket-1");
  await storage.addFileFromPath("./tests/data/image1.jpg", "subdir/sub subdir/new name.jpg");

  let files = await storage.listFiles();
  console.log("list files", files);

  await storage.clearBucket();

  files = await storage.listFiles();
  console.log("list files", files);

  await storage.addFileFromPath("./tests/data/image1.jpg", "subdir/sub subdir/new name.jpg");
  files = await storage.listFiles();
  console.log("add file", files);

  await storage.removeFile("subdir/sub-subdir/new-name.jpg");
  files = await storage.listFiles();
  console.log("remove file", files);

  await storage.addFileFromPath("./tests/data/image1.jpg", "tmp.jpg");

  await storage.deleteBucket("bucket-1");
  await storage.deleteBucket("bucket-2");
  // await storage.deleteBucket(bucket);
  console.log("\n");
};

/* uncomment one of the following lines to test a single storage type: */
// const storage = new StorageLocal(configLocal);
// const storage = new StorageAmazonS3(configS3);
// const storage = new StorageGoogleCloud(configGoogle);
// const storage = new StorageGoogleCloud(process.env.STORAGE_URL);

const storage = new Storage();
// console.log(storage.introspect());
test(storage);

/* or run all tests */
// test(new StorageLocal(configLocal))
//   .then(() => test(new StorageAmazonS3(configS3)))
//   .then(() => test(new StorageGoogleCloud(configGoogle)))
//   .then(() => test(new StorageGoogleCloud(process.env.STORAGE_URL)))
//   .then(() => {
//     console.log("done");
//   })
//   .catch(e => {
//     console.log(e);
//   });
