import { Storage } from "../src/Storage";
import { IAdapter, Provider } from "../src/types/general";
import { getConfig } from "./config";
import { timeout } from "./util";

let storage: Storage;

function colorLog(s: string): string {
  return `\x1b[96m [${s}]\x1b[0m`;
}

let provider = Provider.LOCAL;
if (process.argv[2]) {
  provider = process.argv[2] as Provider;
}

async function run() {
  const bucket = "aap894";
  let r: any;

  storage = new Storage(getConfig(provider));
  // console.log(storage.getAdapter().constructor.name);
  // r = await storage.deleteBucket("aap899");
  // console.log(colorLog("deleteBucket"), r);

  // r = await storage.listBuckets();
  // if (r.value !== null && r.value.length > 0) {
  //   await deleteAllBuckets(r.value, storage);
  // }

  r = await storage.createBucket("aap894", { bucketType: "aap" });
  console.log(colorLog("createBucket"), r);
  // r = await storage.bucketIsPublic("aap899");
  // console.log(colorLog("createBucket"), r);

  // storage.setSelectedBucket("aap899")

  // r = await storage.addFileFromPath({
  //   origPath: "./tests/data/image1.jpg",
  //   targetPath: "image1-path.jpg",
  //   options: {
  //     ACL: "public-read"
  //   }
  // });
  // console.log(colorLog("addFileFromPath"), r);

  // r = await storage.getPublicURL("image1-path.jpg", { noCheck: false });
  // console.log(colorLog("getPublicURL"), r);

  // r = await storage.getSignedURL("image1-path.jpg", { noCheck: false });
  // console.log(colorLog("getPresignedURL"), r);

  // r = await storage.bucketIsPublic();
  // console.log(colorLog("bucketIsPublic"), r);
}

run();
