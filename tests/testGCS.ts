import dotenv from "dotenv";
import { StorageType } from "../src/types";
import { AdapterGoogleCloudStorage } from "../src/AdapterGoogleCloudStorage";
import { parseMode, parseUrl } from "../src/util";

dotenv.config();

async function test() {
  const a = new AdapterGoogleCloudStorage();
  const b = await a.listBuckets();
  console.log(b);
}

test();
