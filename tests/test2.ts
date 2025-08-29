import fs from "fs";
import path from "path";
import { rimraf } from "rimraf";
import { Storage } from "../src/Storage";
import { AdapterAmazonS3 } from "../src/AdapterAmazonS3";
import { IAdapter, Options, StorageType } from "../src/types/general";
import { getConfig } from "./config";
import { saveFile, timeout } from "./util";
import { ResultObject } from "../src/types/result";

let storage: Storage;

function colorLog(s: string): string {
  return `\x1b[96m [${s}]\x1b[0m`;
}

const types = [
  StorageType.LOCAL, // 0
  StorageType.S3, // 1
  StorageType.B2, // 2
  StorageType.GCS, // 3
  StorageType.AZURE, // 4
  StorageType.MINIO, // 5
  "S3-Cubbit", // 6
  "S3-Cloudflare-R2", // 7
  "S3-Backblaze-B2", // 8
];

let index = 0;
// console.log(process.argv);
if (process.argv[2]) {
  index = parseInt(process.argv[2], 10);
}

async function deleteAllBuckets(list: Array<string>, storage: IAdapter, delay: number = 500) {
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    console.log(colorLog("remove bucket"), b);
    try {
      await storage.clearBucket(b);
      if (delay) {
        await timeout(delay);
      }
      // const files = await storage.listFiles();
      // console.log(`\tfiles: ${files}`);
      await storage.deleteBucket(b);
    } catch (e) {
      console.error("\x1b[31m", "[Error removeAllBuckets]", b, e.message);
    }
  }
}

async function run() {
  const bucket = "aap893";
  let r: any;

  storage = new Storage(getConfig(types[index]));

  r = await storage.listBuckets();
  if (r.value !== null && r.value.length > 0) {
    await deleteAllBuckets(r.value, storage);
  }

  r = await storage.createBucket(bucket, { public: true });
  console.log(colorLog("createBucket"), r);

  storage.setSelectedBucket(bucket)

  r = await storage.addFileFromPath({
    origPath: "./tests/data/image1.jpg",
    targetPath: "image1-path.jpg",
    options: {
      // ACL: "public-read"
      useSignedURL: true,
    }
  });
  console.log(colorLog("addFileFromPath"), r);

  r = await storage.getPublicURL("image1-path.jpg", { noCheck: false });
  console.log(colorLog("getPublicURL"), r);

  r = await storage.getSignedURL("image1-path.jpg", { noCheck: false });
  console.log(colorLog("getPresignedURL"), r);
}

run();
