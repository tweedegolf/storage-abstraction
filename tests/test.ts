import dotenv from "dotenv";
import fs, { createReadStream } from "fs";
import path from "path";
import { Storage } from "../src/Storage";
import { IStorage } from "../src/types";
import { Readable, Writable } from "stream";
dotenv.config();

/**
 * Below 3 examples of how you can populate a config object using environment variables.
 * Note that you name the environment variables to your liking.
 */
const configS3 = {
  accessKeyId: process.env.STORAGE_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_AWS_SECRET_ACCESS_KEY,
  bucketName: process.env.STORAGE_BUCKETNAME,
};

const configGoogle = {
  projectId: process.env.STORAGE_GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.STORAGE_GOOGLE_CLOUD_KEYFILE,
  bucketName: process.env.STORAGE_BUCKETNAME,
};

const configLocal = {
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
const test = async (storage: IStorage): Promise<void> => {
  console.log("=>", storage.getType());
  const bucket = storage.getSelectedBucket();

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
    await copyFile(readStream, writeStream);
    const size = (await fs.promises.stat(p)).size;
    console.log("size partial", size);
  } catch (e) {
    console.error("\x1b[31m", e, "\n");
  }
  await fs.promises.unlink(path.join(process.cwd(), "test-partial.jpg"));

  try {
    const readStream = await storage.getFileAsReadable("test.jpg");
    const p = path.join(process.cwd(), "test.jpg");
    const writeStream = fs.createWriteStream(p);
    await copyFile(readStream, writeStream);
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
  console.log(`select bucket "${storage.getSelectedBucket()}"`);
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
  await storage.deleteBucket("tmp");
  buckets = await storage.listBuckets();
  console.log(`cleanup buckets ${buckets}`);
  console.log("\n");
};

const run = async (): Promise<void> => {
  /* uncomment one of the following lines to test a single storage type: */
  // const storage = new Storage(configLocal);
  // const storage = new Storage(configS3);
  // const storage = new Storage(configGoogle);

  // const storage = new Storage(process.env.STORAGE_URL);
  const storage = new Storage(`local://tests/test slug dir?mode=500&slug=true`);

  // Note that since 1.4 you have to call `init()` before you can make API calls
  try {
    await storage.init();
  } catch (e) {
    console.error("\x1b[31m", e, "\n");
    process.exit(0);
  }

  test(storage);

  /* or run all tests */
  // test(new StorageLocal(configLocal))
  //   .then(() => test(new Storage(configS3)))
  //   .then(() => test(new Storage(configGoogle)))
  //   .then(() => test(new Storage(process.env.STORAGE_URL)))
  //   .then(() => {
  //     console.log("done");
  //   })
  //   .catch(e => {
  //     console.log(e);
  //   });
};

run();
