import dotenv from "dotenv";
import { AdapterAzureStorageBlob } from "../src/AdapterAzureStorageBlob";

dotenv.config();

async function test() {
  const a = new AdapterAzureStorageBlob({ type: "azure", accountName: "tweedegolf" });
  const b = await a.listBuckets();
  console.log(b);
  // console.log(a.configError);
}

test();
