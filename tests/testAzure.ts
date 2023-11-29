import dotenv from "dotenv";
import { Storage } from "../src/Storage";

dotenv.config();

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

async function test() {
  const s = new Storage({
    type: "azure",
    accountName,
    accountKey,
  });
  // const b = await s.listBuckets();
  // console.log(b);
  // const b = await s.listFiles("the-buck");
  // console.log(b);
  // console.log(a.configError);
  // const b = await s.createBucket("the-buck");
  // console.log(b);

  // const b = await s.bucketExists("the-buck");
  // console.log(b);
  // const b = await s.fileExists("the-buck", "image1.jpg");
  // console.log(b);

  const b = await s.addFile({
    bucketName: "the-buck",
    origPath: "/home/abudaan/Pictures/351136564_1430365671153234_1297313861719590737_n.jpg",
    targetPath: "image4.jpg",
  });
  console.log(b);
}

test();
