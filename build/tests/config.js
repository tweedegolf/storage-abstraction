"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
require("jasmine");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const general_1 = require("../src/types/general");
function getConfig(provider = general_1.Provider.LOCAL) {
    dotenv_1.default.config();
    let config = "";
    if (provider === general_1.Provider.LOCAL) {
        config = {
            provider,
            bucketName: process.env.BUCKET_NAME,
            directory: process.env.LOCAL_DIRECTORY,
        };
    }
    else if (provider === general_1.Provider.GCS || provider === general_1.Provider.GS) {
        config = {
            provider,
            bucketName: process.env.BUCKET_NAME,
            keyFilename: process.env.GOOGLE_CLOUD_KEY_FILENAME,
        };
    }
    else if (provider === general_1.Provider.S3 || provider === general_1.Provider.AWS) {
        config = {
            provider,
            bucketName: process.env.BUCKET_NAME,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
            options: {
                foo: "bar",
            },
        };
    }
    else if (provider === general_1.Provider.CLOUDFLARE) {
        config = {
            provider,
            region: process.env.R2_REGION,
            bucketName: process.env.BUCKET_NAME,
            endpoint: process.env.R2_ENDPOINT,
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        };
        // config = `r2://${process.env.R2_ACCESS_KEY_ID}:${process.env.R2_SECRET_ACCESS_KEY}@${process.env.BUCKET_NAME}?endpoint=${process.env.R2_ENDPOINT}&region=${process.env.R2_REGION}`;
    }
    else if (provider === general_1.Provider.B2_S3) {
        config = {
            provider,
            bucketName: process.env.BUCKET_NAME,
            region: process.env.B2_S3_REGION,
            endpoint: process.env.B2_S3_ENDPOINT,
            accessKeyId: process.env.B2_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.B2_S3_SECRET_ACCESS_KEY,
        };
    }
    else if (provider === general_1.Provider.CUBBIT) {
        config = {
            provider,
            region: "us-west-1",
            bucketName: process.env.BUCKET_NAME,
            endpoint: process.env.CUBBIT_ENDPOINT,
            accessKeyId: process.env.CUBBIT_ACCESS_KEY_ID,
            secretAccessKey: process.env.CUBBIT_SECRET_ACCESS_KEY,
        };
    }
    else if (provider === general_1.Provider.MINIO_S3) {
        config = {
            provider,
            bucketName: process.env.BUCKET_NAME,
            // endpoint: process.env.MINIO_ENDPOINT_DOCKER,
            // accessKeyId: process.env.MINIO_ACCESS_KEY_DOCKER,
            // secretAccessKey: process.env.MINIO_SECRET_KEY_DOCKER,
            // region: "us-east-1",
            region: "af-south-1",
            endpoint: process.env.MINIO_ENDPOINT_S3,
            accessKeyId: process.env.MINIO_ACCESS_KEY,
            secretAccessKey: process.env.MINIO_SECRET_KEY,
            // region: process.env.MINIO_SECRET_KEY_DOCKER,
            // forcePathStyle: true,
        };
    }
    else if (provider === general_1.Provider.B2) {
        config = {
            provider,
            bucketName: process.env.BUCKET_NAME,
            applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
            applicationKey: process.env.B2_APPLICATION_KEY,
        };
    }
    else if (provider === general_1.Provider.AZURE) {
        const test = 3;
        if (test === 1) {
            // azurite local
            config = {
                provider,
                bucketName: process.env.BUCKET_NAME,
                accountName: process.env.AZURITE_ACCOUNT_NAME,
                accountKey: process.env.AZURITE_ACCOUNT_KEY,
                blobDomain: process.env.AZURITE_BLOB_ENDPOINT,
            };
        }
        else if (test === 2) {
            // connection string azurite
            config = {
                provider,
                bucketName: process.env.BUCKET_NAME,
                connectionString: `DefaultEndpointsProtocol=http;AccountName=${process.env.AZURITE_ACCOUNT_NAME};AccountKey=${process.env.AZURITE_ACCOUNT_KEY};BlobEndpoint=http://127.0.0.1:10000/${process.env.AZURITE_ACCOUNT_NAME};`,
            };
        }
        else if (test === 3) {
            // account name and key
            config = {
                provider,
                bucketName: process.env.BUCKET_NAME,
                accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
                accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
            };
        }
        else if (test === 4) {
            // connection string azure
            config = {
                provider,
                bucketName: process.env.BUCKET_NAME,
                connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
            };
        }
        else if (test === 5) {
            // sas token
            config = {
                provider,
                bucketName: process.env.BUCKET_NAME,
                accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
                sasToken: process.env.AZURE_STORAGE_SAS_TOKEN,
            };
        }
        else if (test === 6) {
            // passwordless
            config = {
                provider,
                bucketName: process.env.BUCKET_NAME,
                accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
            };
        }
    }
    else if (provider === general_1.Provider.MINIO) {
        config = {
            provider,
            endPoint: process.env.MINIO_ENDPOINT,
            port: process.env.MINIO_PORT,
            useSSL: process.env.MINIO_USE_SSL,
            region: process.env.MINIO_REGION,
            accessKey: process.env.MINIO_ACCESS_KEY,
            secretKey: process.env.MINIO_SECRET_KEY,
        };
        config = `minio://${process.env.MINIO_ACCESS_KEY}:${process.env.MINIO_SECRET_KEY}@${process.env.BUCKET_NAME}?endPoint=${process.env.MINIO_ENDPOINT}&port=${process.env.MINIO_PORT}&useSSL=${process.env.MINIO_USE_SSL}&region=${process.env.MINIO_REGION}`;
        // config = `minio://minioadmin:minioadmin@${process.env.BUCKET_NAME}?endPoint=localhost&port=9000&useSSL=false&region=${process.env.MINIO_REGION}`;
    }
    else {
        // const p = path.join(process.cwd(), "tests", "test_directory");
        const p = path_1.default.join("tests", "test_directory");
        config = process.env.CONFIG_URL || `local://${p}`;
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
//# sourceMappingURL=config.js.map