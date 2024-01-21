import { AdapterConfig, StorageType } from "./types/general";
import { ParseUrlResult, ResultObjectNumber } from "./types/result";

/**
 * @param: url
 * Converts url with querystring into key-value object
 */
export const parseQueryString2 = (url: string): { [id: string]: string } => {
  let options = {};
  const questionMark = url.indexOf("?");
  if (questionMark !== -1) {
    options = url
      .substring(questionMark + 1)
      .split("&")
      .map((pair) => pair.split("="))
      .reduce((acc, val) => {
        // acc[val[0]] = `${val[1]}`.valueOf();
        acc[val[0]] = val[1];
        return acc;
      }, {});
  }
  return options;
};

/**
 * @param url
 * Parses a url into a key-value object.
 */
export const parseUrl = (url: string, checkType = false): ParseUrlResult => {
  const p = url.indexOf("://");
  let type: string;
  let config: AdapterConfig;

  if (p === -1) {
    type = url;
    config = { type };
  } else {
    type = url.substring(0, p);
    config = parseQueryString(url.substring(p + 3), type);
  }

  if (checkType === true && Object.values(StorageType).includes(type as StorageType) === false) {
    return { value: null, error: `"${type}" is not a valid storage type` };
  }
  return { value: config, error: null };
};

export const parseQueryString = (s: string, type?: string): { [id: string]: string } => {
  return s
    .split("&")
    .map((pair) => pair.split("="))
    .reduce(
      (acc, val) => {
        acc[val[0]] = val[1];
        return acc;
      },
      type ? { type } : {}
    );
};

/**
 * @param: url
 *
 * strips off the querystring of an url and returns it as an object
 */
export const parseQuerystring = (url: string): { [id: string]: string } => {
  let options = {};
  const questionMark = url.indexOf("?");
  if (questionMark !== -1) {
    options = url
      .substring(questionMark + 1)
      .split("&")
      .map((pair) => pair.split("="))
      .reduce((acc, val) => {
        // acc[val[0]] = `${val[1]}`.valueOf();
        acc[val[0]] = val[1];
        return acc;
      }, {});
  }
  return options;
};

/**
 * @param url
 * Parses a url string into fragments and parses the query string into a
 * key-value object.
 */
export const parseUrl2 = (
  url: string
): {
  error: null | string;
  type: string;
  part1: string;
  part2: string;
  bucketName: string;
  extraOptions: { [key: string]: string };
} => {
  let type = null;
  let part1 = null;
  let part2 = null;
  let bucketName = null;
  let extraOptions = null;

  if (isBlankString(url)) {
    return {
      type,
      part1,
      part2,
      bucketName,
      extraOptions,
      error: "please provide a configuration url",
    };
  }
  type = url.substring(0, url.indexOf("://"));
  let config = url.substring(url.indexOf("://") + 3);
  const at = config.indexOf("@");
  const questionMark = config.indexOf("?");
  const colon = config.indexOf(":");

  // parse options
  if (questionMark !== -1) {
    extraOptions = parseQuerystring(url);
    config = config.substring(0, questionMark);
  }
  // console.log("config", config);

  // get bucket name and region
  let bucketString = "";
  if (at !== -1) {
    bucketString = config.substring(at + 1);
    if (questionMark !== -1) {
      bucketName = bucketString.substring(0, questionMark);
    } else {
      bucketName = bucketString;
    }
    config = config.substring(0, at);
  }

  // get credentials
  if (colon !== -1) {
    [part1, part2] = config.split(":");
  } else if (config !== "") {
    part1 = config;
  }

  return { type, part1, part2, bucketName, extraOptions, error: null };
};

/**
 * @param {string} s
 *
 * Parses a string that contains a radix prefix to a number
 *
 */
export const parseIntFromString = (s: string): number => {
  if (s.startsWith("0o")) {
    return parseInt(s, 8);
  }
  if (s.startsWith("0x") || s.startsWith("0X")) {
    return parseInt(s, 16);
  }
  if (s.startsWith("0b") || s.startsWith("0B")) {
    return parseInt(s, 2);
  }
  return parseInt(s);
};

export const parseMode = (mode: number | string): ResultObjectNumber => {
  // if mode is a number, parseMode assumes it is a decimal number
  if (typeof mode === "number") {
    if (mode < 0) {
      return {
        value: null,
        error: `The argument 'mode' must be a 32-bit unsigned integer or an octal string. Received ${mode}`,
      };
    }
    return { value: mode, error: null };
  }

  // mode is a string

  // e.g "0o755" (octal string)
  if (mode.startsWith("0o")) {
    return { value: parseInt(mode.substring(2), 8), error: null };
  }
  // e.g '511' (decimal)
  const i = parseInt(mode, 10);
  // quick fix for erroneously passed octal number as string (without 0o prefix)
  return { value: i > 511 ? 511 : i, error: null };
};

/**
 * @param {string} url
 *
 * strips off the protocol of an url and returns it
 */
export const getProtocol = (url: string): string => {
  return;
};

/**
 * @param {string} str
 *
 * Checks if the value of the name is not null or undefined
 */
export const isBlankString = (str: string): boolean => {
  return !str || /^\s*$/.test(str);
};

/**
 * @param {string} name
 *
 * Checks if the value of the name is not null, undefined or an empty string
 */
export const validateName = (name: string): string => {
  if (name === null) {
    return "Bucket name can not be `null`";
  }
  if (name === "null") {
    return 'Please do not use the string "null" as bucket name';
  }
  if (typeof name === "undefined") {
    return "Bucket name can not be `undefined`";
  }
  if (name === "undefined") {
    return 'Please do not use the string "undefined" as bucket name';
  }
  if (isBlankString(name)) {
    return "Bucket name can not be an empty string";
  }
  return null;
};

/*
// not in use, keep for reference
export const getGCSProjectIdAsync = async (config: string): Promise<string> => {
  const data = await fs.promises.readFile(config).catch(e => {
    throw e;
  });
  const json = JSON.parse(data.toString("utf-8"));
  return json.project_id;
};

// not in use, keep for reference
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
  
  export const BucketLocationConstraintAsString = (c: BucketLocationConstraint): string => {
    return;
  };
*/

/**
 * @param url
 * Parses a url string into fragments and parses the query string into a
 * key-value object.
 
export const parseUrl = (url: string): ParseUrlResult => {
  if (url.indexOf("://") === -1) {
    return { value: null, error: "Please provide a valid configuration url" };
  }
  const type = url.substring(0, url.indexOf("://"));
  // if (Object.values(StorageType).includes(type as StorageType) === false) {
  //   return { value: null, error: `"${type}" is not a valid storage type` };
  // }
  let config = url.substring(url.indexOf("://") + 3);
  const at = config.indexOf("@");
  const questionMark = config.indexOf("?");
  const colon = config.indexOf(":");
  let part1 = "";
  let part2 = "";
  let part3 = "";
  let bucketName = "";

  // parse options
  const queryString: { [key: string]: string } = parseQuerystring(url);
  if (questionMark !== -1) {
    config = config.substring(0, questionMark);
  }
  // console.log("config", config);

  // get bucket name and region
  let bucketString = "";
  if (at !== -1) {
    bucketString = config.substring(at + 1);
    const slash = bucketString.indexOf("/");
    if (slash !== -1) {
      // Amazon S3 @region/bucket
      bucketName = bucketString.substring(slash + 1);
      part3 = bucketString.substring(0, slash);
    } else {
      bucketName = bucketString;
    }
    // console.log(bucketName, bucketString, slash);
    config = config.substring(0, at);
  }

  // get credentials
  if (colon !== -1) {
    [part1, part2] = config.split(":");
  } else {
    part1 = config;
  }

  // console.log(type, part1, part2, region, bucketName, queryString);
  return { error: null, value: { type, part1, part2, part3, bucketName, queryString } };
};
*/
