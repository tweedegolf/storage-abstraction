import "jasmine";
import dotenv from "dotenv";
import { AdapterConfig, StorageType } from "../src/types";

export function getConfig(): string | AdapterConfig {
  dotenv.config();

  const type = process.env.TYPE || StorageType.LOCAL;

  let config: AdapterConfig | string = "";
  if (type === StorageType.LOCAL) {
    config = {
      type,
      bucketName: process.env.BUCKET_NAME,
      directory: process.env.LOCAL_DIRECTORY,
    };
  } else if (type === StorageType.GCS) {
    config = {
      type: StorageType.GCS,
      bucketName: process.env.BUCKET_NAME,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILENAME,
    };
  } else if (type === StorageType.S3) {
    config = {
      type,
      bucketName: process.env.BUCKET_NAME,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    };
  } else if (type === StorageType.B2) {
    config = {
      type,
      bucketName: process.env.BUCKET_NAME,
      applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
      applicationKey: process.env.B2_APPLICATION_KEY,
    };
  } else if (type === StorageType.AZURE) {
    config = {
      type,
      bucketName: process.env.BUCKET_NAME,
      storageAccount: process.env.AZURE_STORAGE_ACCOUNT_NAME,
      accessKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
    };
  } else {
    config = process.env.CONFIG_URL || `local://${process.cwd()}/the-buck`;
  }

  return config;
}
