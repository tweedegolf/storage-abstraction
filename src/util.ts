import fs from "fs";
import path from "path";
import {
  StorageConfig,
  StorageType,
  ConfigGoogleCloud,
  ConfigAmazonS3,
  ConfigLocal,
} from "./types";

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

// get the project_id from the keyFile
const getGCSProjectId = (config: string): string => {
  const data = fs.readFileSync(config).toString("utf-8");
  const json = JSON.parse(data);
  return json.project_id;
};

// create local bucket if it doesn't exist
const createLocalBucket = (directory: string, bucketName: string): void => {
  const p = path.join(directory, bucketName);
  const exists = fs.existsSync(p);
  // https://nodejs.org/api/fs.html#fs_fs_access_path_mode_callback
  // console.log("constructor", config, exists);
  if (!exists) {
    fs.mkdir(p, { recursive: true }, err => {
      if (err) {
        throw err;
      }
    });
  }
};

export const parseUrlString = (url: string): [string, StorageConfig] => {
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
      config = path.join(process.cwd(), "local-bucket");
    }
    const bucketName = path.basename(config);
    const directory = path.dirname(config);
    createLocalBucket(directory, bucketName);
    return [
      type,
      {
        directory,
        bucketName,
      },
    ];
  } else if (type === StorageType.S3) {
    const at = config.indexOf("@");
    let questionMark = config.indexOf("?");
    let credentials: string[] = [];
    let region = "";
    let bucketName = "";
    let options: { [key: string]: string } = {};

    if (at !== -1) {
      credentials = config.substring(0, config.indexOf("@")).split(":");
    } else {
      const end = questionMark === -1 ? config.length : questionMark;
      credentials = config.substring(0, end).split(":");
    }
    const [accessKeyId, secretAccessKey] = credentials;
    if (!accessKeyId || !secretAccessKey) {
      throw new Error("provide both an accessKeyId and a secretAccessKey!");
    }

    if (at !== -1) {
      // remove credentials
      config = config.substring(at + 1);
      // position of question mark has shifted
      questionMark = config.indexOf("?");
      const end = config.length;
      const slash = config.indexOf("/");
      region = config.substring(0, slash !== -1 ? slash : end);
      if (slash !== -1) {
        bucketName = config.substring(slash + 1, questionMark !== -1 ? questionMark : end);
      }
    }

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
    return [
      type,
      {
        accessKeyId,
        secretAccessKey,
        apiVersion: "2006-03-01", // will be overruled if apiVersion is provided in the config
        region,
        bucketName,
        // note: if region and bucketName are present in the options object they will overrule the earlier set values
        ...options,
      },
    ];
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
      projectId = getGCSProjectId(config);
      keyFilename = config.substring(0, config.length);
    }
    // console.log("[KF]", keyFilename, "[PI]", projectId, "[B]", bucketName);
    return [type, { keyFilename, projectId, bucketName }];
  } else {
    throw new Error("Not a supported configuration");
  }
};

export const parseConfig = (args: string | StorageConfig): [string, StorageConfig] => {
  if (typeof args === "string" || typeof args === "undefined") {
    return parseUrlString(args);
  }
  if ((args as ConfigGoogleCloud).keyFilename) {
    if (!(args as ConfigGoogleCloud).projectId) {
      const { bucketName, keyFilename } = args as ConfigGoogleCloud;
      const clone: ConfigGoogleCloud = {
        bucketName,
        keyFilename,
        projectId: getGCSProjectId(keyFilename),
      };
      return [StorageType.GCS, clone];
    }
    return [StorageType.GCS, args];
  } else if ((args as ConfigAmazonS3).accessKeyId && (args as ConfigAmazonS3).secretAccessKey) {
    return [StorageType.S3, args];
  } else if ((args as ConfigLocal).directory || (args as ConfigLocal).bucketName) {
    let { directory, bucketName } = args as ConfigLocal;
    if (!bucketName && !directory) {
      directory = process.cwd();
      bucketName = "local-bucket";
    } else if (!bucketName && directory) {
      bucketName = path.basename(directory);
      directory = path.dirname(directory);
    } else if (bucketName && !directory) {
      directory = process.cwd();
    }
    createLocalBucket(directory, bucketName);
    return [StorageType.LOCAL, { directory, bucketName }];
  } else {
    throw new Error("Not a supported configuration");
  }
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

export const parseUrlGeneric = (
  url: string
): [string, string, string, { [key: string]: string }] => {
  const type = url.substring(0, url.indexOf("://"));
  let config = url.substring(url.indexOf("://") + 3);
  const questionMark = config.indexOf("?");
  const colon = config.indexOf(":");
  let part1 = "";
  let part2 = "";
  let options: { [key: string]: string } = {};
  let optionsString = "";
  if (questionMark !== -1) {
    optionsString = config.substring(questionMark + 1);
    config = config.substring(0, questionMark);
  }
  if (colon !== -1) {
    [part1, part2] = config.split(":");
  } else {
    // throw Error("url must be formatted as: type://part1:part2[?key1=value1&key2=value2]");
    part1 = config;
  }
  // console.log(config, optionsString);
  if (questionMark !== -1) {
    options = optionsString
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
  // console.log(type, part1, part2, options);
  return [type, part1, part2, options];
};
