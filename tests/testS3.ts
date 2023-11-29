import dotenv from "dotenv";
import { StorageType } from "../src/types";
import { AdapterAmazonS3 } from "../src/AdapterAmazonS3";
// import { parseMode, parseUrl } from "../src/util";
import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { Storage } from "../src/Storage";

dotenv.config();

// const accessKeyId = process.env["AWS_ACCESS_KEY_ID"];
// const secretAccessKey = process.env["AWS_SECRET_ACCESS_KEY"];

// const configS3: ConfigAmazonS3 = {
//   type: StorageType.S3,
//   region: "us-east-1",
//   skipCheck: true,
//   // accessKeyId,
//   // secretAccessKey,
//   bucketName: process.env.BUCKET_NAME,
// };

async function test() {
  const config = "s3://key:secret/can/contain/slashes@eu-west-2/the-buck";

  // const s = new AdapterAmazonS3({ region: "eu-west-1" });
  const s = new Storage({ type: StorageType.S3, region: "eu-west-1" });
  console.log(s.config);
  const b = await s.listBuckets();
  console.log(b);

  // const s3 = new S3Client({ region: "us-east-1" });
  // const command = new ListBucketsCommand({});
  // s3.send(command)
  //   .then((response) => {
  //     const bucketNames = response.Buckets?.map((d) => d?.Name);
  //     console.log(bucketNames);
  //   })
  //   .catch((e) => {
  //     console.log(e);
  //   });
}

test();

/*
this.storage = new S3Client({
  region: this._config.region,
  endpoint: this._config.endpoint,
  credentials: {
    accessKeyId: this._config.accessKeyId,
    secretAccessKey: this._config.secretAccessKey,
  },
});


if (typeof this._config.region === "undefined") {
  if (this.s3Compatible === S3Compatible.R2) {
    this._config.region = "auto";
  } else if (this.s3Compatible === S3Compatible.Backblaze) {
    let ep = this._config.endpoint as string;
    ep = ep.substring(ep.indexOf("s3.") + 3);
    this._config.region = ep.substring(0, ep.indexOf("."));
  }
}
if (typeof this._config.endpoint === "undefined") {
  // this.storage = new S3Client({ region: this._config.region, ...this._config.options });
  this.storage = new S3Client({ region: "us-east-1" });
  console.log(this.storage.config);
} else {
  this.storage = new S3Client(config);
}


    if (typeof cfg.endpoint !== "undefined") {
      if (cfg.endpoint.indexOf("r2.cloudflarestorage.com") !== -1) {
        this.s3Compatible = S3Compatible.R2;
      } else if (cfg.endpoint.indexOf("backblazeb2.com") !== -1) {
        this.s3Compatible = S3Compatible.Backblaze;
      }
    }
    if (!cfg.region && this.s3Compatible === S3Compatible.Amazon) {
      this.configError = "You must specify a default region for storage type 's3'";
      return null;
    }


*/
