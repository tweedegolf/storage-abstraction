import fs from "fs";
import { StorageConfig, StorageType } from "./types";

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
  const type = url.substring(0, url.indexOf("://"));
  let config = url.substring(url.indexOf("://") + 3);
  console.log("[URL]", url);
  if (type === "local") {
  } else if (type === "s3") {
    // const { accessKeyId, secretAccessKey } = config;
    // if (!accessKeyId || !secretAccessKey) {
    //   throw new Error("provide both an accessKeyId and a secretAccessKey!");
    // }
    // apiVersion: "2006-03-01"
  } else if (type === StorageType.GCS) {
    const slash = config.indexOf("/");
    const colon = config.indexOf(":");
    let bucketName = "";
    let keyFilename = "";
    let projectId = "";
    if (slash !== -1) {
      bucketName = config.substring(slash + 1);
      config = config.substring(0, slash);
    }
    if (colon !== -1) {
      keyFilename = config.substring(0, colon);
      projectId = config.substring(colon + 1, config.length);
    } else {
      keyFilename = config.substring(0, config.length);
      const data = fs.readFileSync(config).toString("utf-8");
      const json = JSON.parse(data);
      projectId = json.project_id;
    }
    console.log("[KF]", keyFilename, "[PI]", projectId, "[B]", bucketName);
    return { type, keyFilename, projectId, bucketName };
  } else {
    throw new Error("Not a supported configuration");
  }
};
