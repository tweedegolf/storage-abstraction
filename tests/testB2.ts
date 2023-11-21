import B2 from "backblaze-b2";
import dotenv from "dotenv";
import { AdapterBackblazeB2 } from "../src/AdapterBackblazeB2";
import { StorageType } from "../src/types";
import { Storage } from "../src/Storage";

dotenv.config();

const applicationKeyId = process.env.B2_APPLICATION_KEY_ID;
const applicationKey = process.env.B2_APPLICATION_KEY;
const configBackblaze = {
  type: StorageType.B2,
  applicationKeyId,
  applicationKey,
  bucketName: process.env.BUCKET_NAME,
};

async function testB2() {
  const storage = new Storage(configBackblaze);
  // const storage = new Storage("opt://configBackblaze");
  // const storage = new AdapterBackblazeB2(`b2://${applicationKeyId}:${applicationKey}`);
  // console.log(storage.config);
  // console.log(storage.getConfiguration());

  const type = storage.getType();

  // console.time("createBucket");
  // const response = await storage.createBucket("the-buck-2023/:{{{");
  // console.log(response);
  // console.timeEnd("createBucket");

  // console.time("removeFile");
  // const response = await storage.removeFile("the-buck", "-2023/:{{{");
  // console.log(response);
  // console.timeEnd("removeFile");

  // console.time("clearBucket");
  // const response = await storage.clearBucket("the-buck");
  // console.log(response);
  // console.timeEnd("clearBucket");

  // console.time("fileExists");
  // const response = await storage.fileExists("the-buck", "input.txt");
  // console.timeEnd("fileExists");
  // console.log(response);

  // console.time("sizeOf");
  // response = await storage.sizeOf("the-buck", "inputsss.txt");
  // console.timeEnd("sizeOf");
  // console.log(response);

  // console.time("listBuckets");
  // const data = await storage.listBuckets();
  // console.timeEnd("listBuckets");

  console.time("listFiles");
  const data2 = await storage.listFiles("the-buck");
  console.timeEnd("listFiles");

  // console.time("listFileNames");
  // const data3 = await storage.listFileNames("the-buck");
  // console.timeEnd("listFileNames");

  // const url = await storage.getFileAsURL("the-buck", "input.txt");
  // console.log(url);

  console.time("addFileFromPath");
  const data3 = await storage.addFile({
    bucketName: "the-buck",
    origPath: `${process.cwd()}/tests/data/image2.jpg`,
    targetPath: "test/image1.jpg",
  });
  console.timeEnd("addFileFromPath");

  console.time("deleteBucket");
  const r2 = await storage.deleteBucket("the-buck");
  console.timeEnd("deleteBucket");
}

async function testB2_2() {
  const storage = new B2(configBackblaze);

  console.time("authorize");
  await storage.authorize();
  console.timeEnd("authorize");

  /*
  const bucketName = configBackblaze.bucketName;
  const targetPath = "input.txt";
  const s = `${storage.downloadUrl}/file/${bucketName}/${targetPath}`;
  console.log(s);

  console.time("buckets");
  const {
    data: { buckets },
  } = await storage.listBuckets();
  console.timeEnd("buckets");

  console.time("listFileVersions");
  const n = "the-buck";
  let id = null;
  for (let i = 0; i < buckets.length; i++) {
    const { bucketId, bucketName } = buckets[i];
    if (bucketName === n) {
      id = bucketId;
      break;
    }
  }

  const r = await storage.listFileVersions({ bucketId: id });
  console.timeEnd("listFileVersions");

  console.time("listFileNames");
  const r2 = await storage.listFileNames({ bucketId: id });
  console.timeEnd("listFileNames");
  // console.log("listFileNames", r2.data.files);
*/
}

(async function run() {
  await testB2();

  // testB2_2();
})();
