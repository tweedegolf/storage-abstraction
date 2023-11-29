import dotenv from "dotenv";
import { StorageType } from "../src/types";
import { Storage } from "../src/Storage";

dotenv.config();

async function test() {
  const config = "local://directory=./tests/tmp&bucketName=the-buck-2024";
  const s = new Storage(config);
  // console.log(s.config);

  // const b = await s.createBucket(s.config.bucketName as string);
  // console.log(b);

  const b = await s.addFile({
    bucketName: s.config.bucketName as string,
    origPath: "/home/abudaan/Pictures/351136564_1430365671153234_1297313861719590737_n.jpg",
    targetPath: "image4.jpg",
  });
  console.log(b);

  // console.log(parseMode("0o777"));
  // console.log(parseMode("511"));
  // console.log(parseMode(0o777));
  // console.log(parseMode(511));
}

test();
