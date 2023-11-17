import B2 from "backblaze-b2";
import dotenv from "dotenv";

import { StorageType } from "@tweedegolf/storage-abstraction";

dotenv.config();

const configBackblaze = {
  type: StorageType.B2,
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
  // bucketName: process.env.BUCKET_NAME,
};

async function testB2() {
  const storage = new B2(configBackblaze);

  let s = new Date().getTime();
  await storage.authorize();
  console.log(1, new Date().getTime() - s);

  s = new Date().getTime();
  const {
    data: { buckets },
  } = await storage.listBuckets();

  const n = "the-buck";
  let id = null;
  for (let i = 0; i < buckets.length; i++) {
    const { bucketId, bucketName } = buckets[i];
    if (bucketName === n) {
      id = bucketId;
      break;
    }
  }
  console.log(2, new Date().getTime() - s);
  console.log("B2", id);
}

testB2();
