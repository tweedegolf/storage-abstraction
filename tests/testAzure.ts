import dotenv from "dotenv";
import { AdapterAzureStorageBlob } from "../src/AdapterAzureStorageBlob";

dotenv.config();

async function test() {
  const a = new AdapterAzureStorageBlob();
  const b = await a.listBuckets();
  console.log(b);
}

test();
