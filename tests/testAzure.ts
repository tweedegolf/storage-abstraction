import dotenv from "dotenv";
import { Storage } from "../src/Storage";

dotenv.config();

async function test() {
  const s = new Storage({
    type: "azure",
    accountName: "tweedegolf",
    accountKey:
      "WHtrTUfF3PLc9Dxnua4Dp7hquH6UTGhE93DhVCwBwVeUNnHceLpuV66myHEO89z54yQhKIlYnMhe+AStdvl51A==",
  });
  const b = await s.listBuckets();
  console.log(b);
  // console.log(a.configError);
}

test();
