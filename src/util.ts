import fs from "fs";
import os from "os";
import path from "path";
import { StorageConfig, StorageType } from "./types";

const allowedOptionsAmazonS3 = {
  bucketName: "string",
  endpoint: "string",
  useDualstack: "boolean",
  region: "string",
  maxRetries: "number",
  maxRedirects: "number",
  sslEnabled: "boolean",
  apiVersion: "string",
};

export const readFilePromise = (path: string): Promise<Buffer> =>
  new Promise(function(resolve, reject) {
    fs.readFile(path, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });

export const parseUrlString = (url: string): StorageConfig => {
  let type = "";
  let config = "";
  if (url === "" || typeof url === "undefined") {
    type = StorageType.LOCAL;
  } else {
    type = url.substring(0, url.indexOf("://"));
    config = url.substring(url.indexOf("://") + 3);
  }
  // console.log("[URL]", url);
  if (type === StorageType.LOCAL) {
    if (config === "") {
      config = path.join(os.tmpdir(), "local-bucket");
    }
    const directory = config.substring(0, config.lastIndexOf("/") + 1);
    const bucketName = config.substring(config.lastIndexOf("/") + 1);
    return {
      type,
      directory,
      bucketName,
    };
  } else if (type === StorageType.S3) {
    const questionMark = config.indexOf("?");
    const credentials = config
      .substring(0, questionMark === -1 ? config.length : questionMark)
      .split(":");
    const [accessKeyId, secretAccessKey] = credentials;
    // remove credentials
    let options: { [key: string]: string } = {};
    if (questionMark !== -1) {
      options = config
        .substring(questionMark + 1)
        .split("&")
        .map(pair => pair.split("="))
        .reduce((acc, val) => {
          const type = allowedOptionsAmazonS3[val[0]];
          if (typeof type !== "undefined") {
            const value = val[1];
            if (type === "boolean") {
              if (value === "true" || value === "false") {
                acc[val[0]] = value === "true";
              }
            } else if (type === "number") {
              const intVal = parseInt(value, 10);
              if (!isNaN(intVal)) {
                acc[val[0]] = intVal;
              }
            } else {
              acc[val[0]] = val[1];
            }
          }
          return acc;
        }, {});
    }
    // console.log(accessKeyId, secretAccessKey, region, bucket, options);
    if (!accessKeyId || !secretAccessKey) {
      throw new Error("provide both an accessKeyId and a secretAccessKey!");
    }
    return {
      accessKeyId,
      secretAccessKey,
      type: StorageType.S3,
      apiVersion: "2006-03-01",
      ...options,
    };
  } else if (type === StorageType.GCS) {
    const slash = config.lastIndexOf("/");
    const colon = config.indexOf(":");
    let bucketName = "";
    let keyFilename = "";
    let projectId = "";
    if (slash !== -1) {
      bucketName = config.substring(slash + 1);
      config = config.substring(0, slash);
    }
    if (colon !== -1) {
      [keyFilename, projectId] = config.split(":");
    } else {
      const data = fs.readFileSync(config).toString("utf-8");
      const json = JSON.parse(data);
      projectId = json.project_id;
      keyFilename = config.substring(0, config.length);
    }
    // console.log("[KF]", keyFilename, "[PI]", projectId, "[B]", bucketName);
    return { type, keyFilename, projectId, bucketName };
  } else {
    throw new Error("Not a supported configuration");
  }
};
