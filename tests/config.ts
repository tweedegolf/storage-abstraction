import "jasmine";
import path from "path";
import dotenv from "dotenv";
import { AdapterConfig, StorageType } from "../src/types";

export function getConfig(t: string = StorageType.LOCAL): string | AdapterConfig {
  dotenv.config();

  let config: AdapterConfig | string = "";
  if (t === StorageType.LOCAL) {
    config = {
      type: StorageType.LOCAL,
      bucketName: process.env.BUCKET_NAME,
      directory: process.env.LOCAL_DIRECTORY,
    };
  } else if (t === StorageType.GCS) {
    config = {
      type: StorageType.GCS,
      bucketName: process.env.BUCKET_NAME,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILENAME,
    };
  } else if (t === StorageType.S3) {
    config = {
      type: StorageType.S3,
      bucketName: process.env.BUCKET_NAME,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    };
  } else if (t === "S3-Cloudflare-R2") {
    config = {
      type: StorageType.S3,
      region: process.env.R2_REGION,
      bucketName: process.env.BUCKET_NAME,
      endpoint: process.env.R2_ENDPOINT,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    };
  } else if (t === "S3-Backblaze-B2") {
    config = {
      type: StorageType.S3,
      bucketName: process.env.BUCKET_NAME,
      region: process.env.B2_S3_REGION,
      endpoint: process.env.B2_S3_ENDPOINT,
      accessKeyId: process.env.B2_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.B2_S3_SECRET_ACCESS_KEY,
    };
  } else if (t === "S3-Cubbit") {
    config = {
      type: StorageType.S3,
      bucketName: process.env.BUCKET_NAME,
      endpoint: process.env.CUBBIT_ENDPOINT,
      accessKeyId: process.env.CUBBIT_ACCESS_KEY_ID,
      secretAccessKey: process.env.CUBBIT_SECRET_ACCESS_KEY,
    };
  } else if (t === StorageType.B2) {
    config = {
      type: StorageType.B2,
      bucketName: process.env.BUCKET_NAME,
      applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
      applicationKey: process.env.B2_APPLICATION_KEY,
    };
  } else if (t === StorageType.AZURE) {
    config = {
      type: StorageType.AZURE,
      bucketName: process.env.BUCKET_NAME,
      accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
      accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
    };
  } else {
    // const p = path.join(process.cwd(), "tests", "test_directory");
    const p = path.join("tests", "test_directory");
    config = process.env.CONFIG_URL || `local://directory=${p}`;
  }

  return config;
}
/*
function tmp() {
  if (typeof (this.config as ConfigAmazonS3).region === "undefined") {
    if (this.s3Compatible === S3Compatible.R2) {
      this.config.region = "auto";
      this.region = this.config.region;
    } else if (this.s3Compatible === S3Compatible.Backblaze) {
      let ep = this.config.endpoint;
      ep = ep.substring(ep.indexOf("s3.") + 3);
      this.config.region = ep.substring(0, ep.indexOf("."));
      // console.log(this.config.region);
      this.region = this.config.region;
    }
  } else {
    this.region = (this.config as ConfigAmazonS3).region;
  }
  if (typeof this.config.endpoint === "undefined") {
    this.storage = new S3Client({ region: this.region });
  } else {
    this.storage = new S3Client({
      region: this.region,
      endpoint: this.config.endpoint,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }
}
*/
