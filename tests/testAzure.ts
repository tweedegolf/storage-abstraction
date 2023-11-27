import dotenv from "dotenv";
import { Storage } from "../src/Storage";

dotenv.config();

async function test() {
  const s = new Storage({
    type: "azure",
    accountName: "tweedegolf",
    accountKey: "",
  });
  const b = await s.listBuckets();
  console.log(b);
  // console.log(a.configError);
}

test();
