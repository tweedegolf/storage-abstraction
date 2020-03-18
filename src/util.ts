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
  let type = "";
  let config = "";
  if (url === "" || typeof url === "undefined") {
    type = StorageType.LOCAL;
  } else {
    type = url.substring(0, url.indexOf("://"));
    config = url.substring(url.indexOf("://") + 3);
  }
  console.log("[URL]", url);
  if (type === StorageType.LOCAL) {
    if (config === "") {
      return { type };
    }
    return {
      type,
      bucketName: url.substring(url.lastIndexOf("/") + 1),
      directory: url.substring(0, url.lastIndexOf("/")),
    };
  } else if (type === StorageType.S3) {
    // s3://key:secret@eu-west-2/the-buck
    const credentials = config.substring(0, config.indexOf("@")).split(":");
    const [accessKeyId, secretAccessKey] = credentials;
    // remove credentials
    config = config.substring(config.indexOf("@") + 1);
    const end = config.length;
    const slash = config.indexOf("/");
    const questionMark = config.indexOf("?");
    const region = config.substring(0, slash !== -1 ? slash : end);
    let bucketName = "";
    let options: { [key: string]: string } = {};
    if (slash !== -1) {
      bucketName = config.substring(slash + 1, questionMark !== -1 ? questionMark : end);
    }
    if (questionMark !== -1) {
      options = config
        .substring(questionMark + 1)
        .split("&")
        .map(pair => pair.split("="))
        .reduce((acc, val) => {
          acc[val[0]] = val[1];
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
      bucketName,
      region,
      type: StorageType.S3,
      apiVersion: "2006-03-01",
      ...options,
    };
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
