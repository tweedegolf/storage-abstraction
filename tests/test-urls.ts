import path from "path";
import dotenv from "dotenv";
import { Storage } from "../src/Storage";
dotenv.config();

const urlsGoogle = [
  "gcs://keyFile.json:appName?bucketName=the-buck",
  "gcs://keyFile.json:appName/",
  "gcs://keyFile.json:appName",
  "gcs://tests/keyFile.json/the-buck", // error
  "gcs://tests/keyFile.json/",
  "gcs://keyFile.json",
];

const urlsAmazon = [
  "s3://key:secret/can/contain/slashes",
  "s3://key:secret/can/contain/slashes?region=eu-west-2&bucketName=the-buck&sslEnabled=true",
  "s3://key:secret/can/contain/slashes?buckeName=the-buck",
  "s3://key:secret/can/contain/slashes?region=eu-west-2&bucketName=the-buck&sslEnabled=true&useDualstack=23&nonExistentKey=true",
];

const urlsBackBlaze = ["b2://key:secret/can/contain/slashes?bucketName=sab-test1"];

const urlsLocal = [
  "local://tests/tmp/the-buck",
  "local://tests/tmp",
  "local://my-bucket",
  "local:///my-bucket",
  "", // error
];

// replace with the url you want to test
const url = urlsBackBlaze[0];
// const type = url.substring(0, url.indexOf("://"));
// // const storage = new StorageBackBlazeB2(process.env.BACKBLAZE_1);
// const StorageClass = require(path.join("../", "src", classes[type]));
// console.log(StorageClass[classes[type]]);
// const storage = new StorageClass[classes[type]](process.env.BACKBLAZE_1);

// const storage = new Storage(process.env.BACKBLAZE_1);
let storage: Storage;
try {
  // storage = new Storage("b2://aap:beer");
  storage = new Storage(process.env.BACKBLAZE_2 || "");
} catch (e) {
  console.error(`\x1b[31m${e.message}`);
  process.exit(0);
}

const test = async (): Promise<void> => {
  await storage.init().catch((e) => {
    console.error(`\x1b[31m${e}`);
    process.exit(0);
  });

  console.log("BUCKET", storage.getSelectedBucket());

  const b = await storage.listBuckets().catch((e) => {
    console.error(`\x1b[31m${e} (listBuckets)`);
    process.exit(0);
  });
  console.log(b);

  await storage.selectBucket("sab-test1");

  const f = await storage.listFiles().catch((e) => {
    console.error(`\x1b[31m${e} (listFiles)`);
    process.exit(0);
  });
  console.log(f);
};

test();
