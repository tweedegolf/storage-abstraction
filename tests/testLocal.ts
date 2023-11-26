import dotenv from "dotenv";
import { StorageType } from "../src/types";
import { ConfigBackblazeB2 } from "@tweedegolf/storage-abstraction";
import { parseMode, parseUrl } from "../src/util";

dotenv.config();

const applicationKeyId = process.env.B2_APPLICATION_KEY_ID;
const applicationKey = process.env.B2_APPLICATION_KEY;
const configBackblaze: ConfigBackblazeB2 = {
  type: StorageType.B2,
  applicationKeyId,
  applicationKey,
  bucketName: process.env.BUCKET_NAME,
  versioning: true,
};

function test() {
  // const config = "local://tests/tmp/@the-buck?param=value";
  const config = "s3://key:secret/can/contain/slashes@eu-west-2/the-buck";
  const { value, error } = parseUrl(config);
  if (error) {
    this.configError = error;
    return null;
  }

  console.log(value);

  console.log(parseMode("0o777"));
  console.log(parseMode("511"));
  console.log(parseMode(0o777));
  console.log(parseMode(511));
}

test();
