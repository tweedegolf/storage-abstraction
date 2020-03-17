import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Storage } from "../src/Storage";
import { IStorage } from "../src/types";
dotenv.config();
/*
const configS3 = {
  // bucketName: process.env.STORAGE_BUCKETNAME,
  accessKeyId: process.env.STORAGE_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_AWS_SECRET_ACCESS_KEY
};
const configGoogle = {
  // bucketName: process.env.STORAGE_BUCKETNAME,
  projectId: process.env.STORAGE_GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.STORAGE_GOOGLE_CLOUD_KEYFILE
};
const configLocal = {
  // bucketName: process.env.STORAGE_BUCKETNAME,
  directory: process.env.STORAGE_LOCAL_DIRECTORY
};
*/
const test = async (storage: IStorage, message: string) => {
  console.log("=>", message);
  let r: any;

  try {
    await storage.test();
  } catch (e) {
    console.error("\x1b[31m", e, "\n");
    return;
  }

  try {
    r = await storage.selectBucket("the-buck");
    console.log('select bucket "the-buck"');
  } catch (e) {
    console.error("\x1b[31m", e, "\n");
  }

  try {
    const readStream = await storage.getFileAsReadable("test.jpg", {
      end: 4000
    });
    const p = path.join(__dirname, "test.jpg");
    // console.log(p);
    const writeStream = fs.createWriteStream(p);
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
  } catch (e) {
    console.error("\x1b[31m", e, "\n");
  }

  return;

  r = await storage.listBuckets();
  console.log("list buckets", r);

  r = await storage.createBucket("fnaap1");
  r = await storage.createBucket("fnaap2");
  r = await storage.createBucket("fnaap3");

  r = await storage.listBuckets();
  console.log("list buckets", r);

  r = await storage.deleteBucket("fnaap3");

  r = await storage.listBuckets();
  console.log("list buckets", r);

  try {
    await storage.addFileFromPath(
      "./tests/data/image1.jpg",
      "subdir/sub subdir/new name.jpg"
    );
  } catch (e) {
    console.log(e.message);
  }

  r = await storage.selectBucket("fnaap1");
  r = await storage.addFileFromPath(
    "./tests/data/image1.jpg",
    "subdir/sub subdir/new name.jpg"
  );

  r = await storage.listFiles();
  console.log("list files", r);

  r = await storage.clearBucket();

  r = await storage.listFiles();
  console.log("list files", r);

  await storage.addFileFromPath(
    "./tests/data/image1.jpg",
    "subdir/sub subdir/new name.jpg"
  );
  r = await storage.listFiles();
  console.log("add file", r);

  await storage.removeFile("subdir/sub-subdir/new-name.jpg");
  r = await storage.listFiles();
  console.log("remove file", r);

  await storage.addFileFromPath("./tests/data/image1.jpg", "tmp.jpg");

  r = await new Promise(
    async (resolve, reject): Promise<void> => {
      const readStream = await storage.getFileAsReadable("tmp.jpg");
      const p = path.join(__dirname, "test.jpg");
      // console.log(p);
      const writeStream = fs.createWriteStream(p);
      readStream
        .pipe(writeStream)
        .on("error", reject)
        .on("finish", resolve);
      writeStream.on("error", reject).on("finish", () => {
        console.log("write finished");
      });
    }
  );
  console.log("readstream error:", typeof r !== "undefined");

  r = await storage.deleteBucket("fnaap1");
  r = await storage.deleteBucket("fnaap2");
  console.log("\n");
};

/* uncomment one of the following lines to test a single storage type: */
// const storage = new StorageLocal(configLocal);
// const storage = new StorageAmazonS3(configS3);
// const storage = new StorageGoogleCloud(configGoogle);
const storage = new Storage("gcs://da2719acad70.json");
test(storage, "test s3");

/* or run all tests */
// test(new StorageLocal(configLocal), "test local")
//   .then(() => test(new StorageAmazonS3(configS3), "test amazon"))
//   .then(() => test(new StorageGoogleCloud(configGoogle), "test google"))
//   .then(() => {
//     console.log("done");
//   })
//   .catch(e => {
//     console.log(e);
//   });
