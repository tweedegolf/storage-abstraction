import dotenv from "dotenv";
import uniquid from "uniquid";
import fs, { createReadStream } from "fs";
import path from "path";
import { Storage } from "../src/Storage";
import { IStorage, StorageType, AdapterConfig } from "../src/types";
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
  region: process.env.AWS_REGION,
};

const configGoogle = {
  type: StorageType.GCS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEYFILE,
  bucketName: process.env.BUCKET_NAME,
};

const configBackblaze = {
  type: StorageType.B2,
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
  bucketName: process.env.BUCKET_NAME,
};

const configAzure = {
  type: StorageType.AZURE,
  storageAccount: process.env.AZURE_STORAGE_ACCOUNT,
  accessKey: process.env.AZURE_STORAGE_ACCESS_KEY,
  bucketName: process.env.BUCKET_NAME,
};

const configLocal = {
  type: StorageType.LOCAL,
  directory: process.env.LOCAL_DIRECTORY,
};

async function timeout(millis: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      return resolve();
    }, millis);
  });
}

async function removeAllBuckets(list: Array<string>, storage: IStorage) {
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    console.log("remove", b);
    try {
      await storage.clearBucket(b);
      if (storage.getType() === StorageType.AZURE) {
        await timeout(1000);
      }
      await storage.deleteBucket(b);
    } catch (e) {
      console.error("\x1b[31m", "[Error removeAllBuckets]", e);
    }
  }
}

async function selectBucket(storage: IStorage) {
  let bucket = storage.getSelectedBucket();
  if (!bucket) {
    bucket = "the-buck-2023";
    try {
      console.log("SELECT BUCKET");
      await storage.selectBucket(bucket);
    } catch (e) {
      console.error("\x1b[31m", "selectBucket", e, "\n");
      return;
    }
  } else {
    console.log("GET SELECTED BUCKET");
  }
  console.log(`\tselected bucket ${bucket}`);
}

const generateBucketName = (): string => `bucket-${uniquid()}-${new Date().getTime()}`;
const bucketNames = [generateBucketName(), generateBucketName(), generateBucketName()];

const test1 = async (storage: IStorage): Promise<void> => {
  try {
    console.log("TEST");
    await storage.test();
  } catch (e) {
    console.error("\x1b[31m", "test", e, "\n");
    return;
  }

  try {
    console.log("LIST BUCKETS");
    const buckets = await storage.listBuckets();
    console.log(`\tbuckets: ${buckets}`);
  } catch (e) {
    console.error("\x1b[31m", "listBuckets", e, "\n");
    return;
  }
  console.log("----------");
};

const test2 = async (storage: IStorage) => {
  await selectBucket(storage);

  try {
    console.log("ADD FILE FROM READABLE");
    const readStream = createReadStream(path.join(process.cwd(), "tests", "data", "image1.jpg"));
    await storage.addFileFromReadable(readStream, "test.jpg");
    const files = await storage.listFiles();
    console.log("\tfiles", files);
  } catch (e) {
    console.error("\x1b[31m", "addFileFromReadable", e, "\n");
  }

  try {
    console.log("GET FILE AS READABLE");
    const readStream = await storage.getFileAsReadable("test.jpg");
    const p = path.join(process.cwd(), "test.jpg");
    const writeStream = fs.createWriteStream(p);
    await copyFile(readStream, writeStream);
    // cleanup
    await fs.promises.unlink(p);
  } catch (e) {
    console.error("\x1b[31m", "getFileAsReadable", e, "\n");
  }

  try {
    console.log("GET FILE AS READABLE (PARTIAL)");
    const readStream = await storage.getFileAsReadable("test.jpg", {
      end: 4000,
    });
    const p = path.join(process.cwd(), "test-partial.jpg");
    const writeStream = fs.createWriteStream(p);
    await copyFile(readStream, writeStream);
    const size = (await fs.promises.stat(p)).size;
    console.log("\tsize", size);
    // cleanup
    await fs.promises.unlink(p);
  } catch (e) {
    console.error("\x1b[31m", "getFileAsReadable (partial)", e, "\n");
  }

  try {
    console.log("CLEAR BUCKET");
    // await storage.clearBucket(bucket);
    await storage.clearBucket();
  } catch (e) {
    console.error("\x1b[31m", "clearBucket", e, "\n");
  }

  console.log("----------");
};

const test3 = async (storage: IStorage) => {
  try {
    console.log("ADD 3 NEW BUCKETS");
    let buckets = await storage.listBuckets();
    console.log("\tlist buckets before", buckets);

    await storage.createBucket(bucketNames[0]);
    await storage.createBucket(bucketNames[1]);
    await storage.createBucket(bucketNames[2]);

    buckets = await storage.listBuckets();
    console.log("\tlist buckets after", buckets);
  } catch (e) {
    console.error("\x1b[31m", "createBucket", e, "\n");
  }

  try {
    console.log("DELETE 2 BUCKETS");
    await storage.deleteBucket(bucketNames[1]);
    await storage.deleteBucket(bucketNames[2]);
    const buckets = await storage.listBuckets();
    console.log("\tlist buckets after", buckets);
  } catch (e) {
    console.error("\x1b[31m", "deleteBucket", e, "\n");
  }
  console.log("----------");
};

const test4 = async (storage: IStorage) => {
  await selectBucket(storage);

  const source = path.join(process.cwd(), "tests", "data", "image1.jpg");
  let target = "subdir/sub subdir/new name.jpg";
  if (storage.getType() === StorageType.B2) {
    // Backblaze does not support white spaces
    target = target.replace(/\s/g, "-");
  }

  try {
    console.log("ADD FILE FROM PATH");
    await storage.addFileFromPath(source, target);
    const files = await storage.listFiles();
    console.log("\tlist files", files);
  } catch (e) {
    console.error("\x1b[31m", "addFileFromPath", e, "\n");
  }

  try {
    console.log("REMOVE FILE");
    await storage.removeFile(target);
    const files = await storage.listFiles();
    console.log("\tremove file", files);
  } catch (e) {
    console.error("\x1b[31m", "removeFile", e, "\n");
  }

  console.log("----------");
};

const test5 = async (storage: IStorage) => {
  await selectBucket(storage);

  try {
    console.log("ADD FILE FROM READABLE");
    const readStream = createReadStream(path.join(process.cwd(), "tests", "data", "image1.jpg"));
    await storage.addFileFromReadable(readStream, "subdir/sub subdir/test.jpg");
    const files = await storage.listFiles();
    console.log("\tfiles", files);
  } catch (e) {
    console.error("\x1b[31m", "addFileFromReadable", e, "\n");
  }

  try {
    console.log("REMOVE ALL BUCKETS");
    let buckets = await storage.listBuckets();
    console.log(`\tbuckets before ${buckets}`);
    await removeAllBuckets(buckets, storage);
    buckets = await storage.listBuckets();
    console.log(`\tbuckets after ${buckets}`);
    console.log("\n");
  } catch (e) {
    console.error("\x1b[31m", "deleteBucket", e, "\n");
  }
  console.log("----------");
};

const run = async (): Promise<void> => {
  /* uncomment one of the following lines to test a single storage type: */
  // const storage = new Storage(configLocal);
  // const storage = new Storage(configS3);
  // const storage = new Storage(configBackblaze);
  // const storage = new Storage(configGoogle);
  const storage = new Storage(configAzure);
  // const storage = new Storage(process.env.STORAGE_URL);

  console.log("=>", storage.getConfiguration());

  const tests = [test5];
  for (let i = 0; i < tests.length; i++) {
    try {
      // Note that since 1.4 you have to call `init()` before you can make API calls.
      // You have to call `init()` only once in the lifetime of a storage but since it
      // should be possible to run every test both individually and in any order,
      // we call it right before every test.
      // There is no performance hit because a storage that has already been initialized
      // directly returns true.
      await storage.init();
    } catch (e) {
      console.error("\x1b[31m", "[init]", e, "\n");
      process.exit(0);
    }
    const t = tests[i];
    await t(storage);
  }
};

run();
