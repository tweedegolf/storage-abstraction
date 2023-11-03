import dotenv from "dotenv";
import { AdapterConfig, StorageType } from "../../src/types";

dotenv.config();

const debug = false;
const type = process.env["TYPE"];
const skipCheck = process.env["SKIP_CHECK"] === "true" ? true : false;
const configUrl = process.env["CONFIG_URL"];
const bucketName = process.env["BUCKET_NAME"];
const directory = process.env["LOCAL_DIRECTORY"];
const projectId = process.env["GOOGLE_CLOUD_PROJECT_ID"];
const keyFilename = process.env["GOOGLE_CLOUD_KEYFILE"];
const accessKeyId = process.env["AWS_ACCESS_KEY_ID"];
const secretAccessKey = process.env["AWS_SECRET_ACCESS_KEY"];
const region = process.env["AWS_REGION"];
const applicationKeyId = process.env["B2_APPLICATION_KEY_ID"];
const applicationKey = process.env["B2_APPLICATION_KEY"];
const storageAccount = process.env["AZURE_STORAGE_ACCOUNT"];
const accessKey = process.env["AZURE_STORAGE_ACCESS_KEY"];

if (debug) {
  console.group(".env");
  console.log({
    type,
    skipCheck,
    configUrl,
    bucketName,
    directory,
    projectId,
    keyFilename,
    accessKeyId,
    secretAccessKey,
    storageAccount,
    accessKey,
  });
  console.groupEnd();
}

export function getConfiguration(): string | AdapterConfig {
  let config: AdapterConfig | string = "";
  if (type === StorageType.LOCAL) {
    config = {
      type,
      skipCheck,
      bucketName,
      directory,
    };
  } else if (type === StorageType.GCS) {
    config = {
      type,
      skipCheck,
      bucketName,
      projectId,
      keyFilename,
    };
  } else if (type === StorageType.S3) {
    config = {
      type,
      skipCheck,
      bucketName,
      accessKeyId,
      secretAccessKey,
      region,
    };
  } else if (type === StorageType.B2) {
    config = {
      type,
      skipCheck,
      bucketName,
      applicationKeyId,
      applicationKey,
    };
  } else if (type === StorageType.AZURE) {
    config = {
      type,
      skipCheck,
      storageAccount,
      accessKey,
      bucketName,
    };
  } else {
    if (!configUrl) {
      config = `local://${process.cwd()}/the-buck`;
    } else {
      config = configUrl;
    }
  }
  return config;
}
