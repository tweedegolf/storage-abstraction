import B2 from "backblaze-b2";
import dotenv from "dotenv";
import { AdapterBackblazeB2 } from "../src/AdapterBackblazeB2";
import { StorageType } from "@tweedegolf/storage-abstraction";

dotenv.config();

const configBackblaze = {
  type: StorageType.B2,
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
  bucketName: process.env.BUCKET_NAME,
};

async function testB2() {
  const storage = new AdapterBackblazeB2(configBackblaze);
  // console.log(storage.config);
  // console.log(storage.getConfiguration());

  const type = storage.getType();
  let s: number;

  s = new Date().getTime();
  const data = await storage.listBuckets();
  console.log(1, new Date().getTime() - s, data);

  s = new Date().getTime();
  const data2 = await storage.listFiles("the-buck");
  console.log(1, new Date().getTime() - s, data2);

  s = new Date().getTime();
  const data3 = await storage.listFileNames("the-buck");
  console.log(3, new Date().getTime() - s, data3);
}

async function testB2_2() {
  const storage = new B2(configBackblaze);
  let s;
  s = new Date().getTime();
  await storage.authorize();
  console.log(1, new Date().getTime() - s);

  s = new Date().getTime();
  const {
    data: { buckets },
  } = await storage.listBuckets();
  console.log(2, new Date().getTime() - s);
  // console.log(buckets);

  s = new Date().getTime();
  const n = "the-buck";
  let id = null;
  for (let i = 0; i < buckets.length; i++) {
    const { bucketId, bucketName } = buckets[i];
    if (bucketName === n) {
      id = bucketId;
      break;
    }
  }
  // console.log(2, new Date().getTime() - s);
  // console.log("B2", id);

  const r = await storage.listFileVersions({ bucketId: id });
  console.log(3, new Date().getTime() - s);
  // console.log("listFileVersions", r.data.files);

  s = new Date().getTime();
  const r2 = await storage.listFileNames({ bucketId: id });
  console.log(4, new Date().getTime() - s);
  // console.log("listFileNames", r2.data.files);
}

testB2();
// testB2_2();
