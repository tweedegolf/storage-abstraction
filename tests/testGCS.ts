import dotenv from "dotenv";
import { StorageType } from "../src/types";
import { AdapterGoogleCloudStorage } from "../src/AdapterGoogleCloudStorage";
import { parseMode, parseUrl } from "../src/util";

// dotenv.config();

async function test() {
  // const a = new AdapterGoogleCloudStorage({
  //   type: "gcs",
  //   projectId: "default-demo-app-35b34",
  //   keyFilename: "/home/abudaan/Projects/storage-abstraction/gcs.json",
  // });
  // const a = new AdapterGoogleCloudStorage(
  //   "gcs://projectId=default-demo-app-35b34&keyFilename=gcs.json"
  // );
  const a = new AdapterGoogleCloudStorage("gcs://projectId=default-demo-app-35b34");
  // const b = await a.listBuckets();
  console.log(a.configError);
}

test();
