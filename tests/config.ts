import "jasmine";
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
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
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
  } else if (t === "R2") {
    config = {
      type: StorageType.S3,
      bucketName: process.env.BUCKET_NAME,
      endpoint: process.env.R2_ENDPOINT,
      accessKey: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_ACCESS_KEY_ID,
    };
  } else if (t === StorageType.B2) {
    config = {
      type: StorageType.S3,
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
    config = process.env.CONFIG_URL || `local://${process.cwd()}/the-buck`;
  }

  return config;
}
