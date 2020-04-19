import fs from "fs";
import path from "path";
import { GenericKey } from "./types";
import slugify from "slugify";

/**
 * @param url
 * Parses a url string into fragments and parses the query string into a
 * key-value object.
 */
export const parseUrl = (
  url: string
): {
  type: string;
  part1: string;
  part2: string;
  part3: string;
  bucketName: string;
  options: { [key: string]: string };
} => {
  if (url === "" || typeof url === "undefined") {
    throw new Error("please provide a configuration url");
  }
  const type = url.substring(0, url.indexOf("://"));
  let config = url.substring(url.indexOf("://") + 3);
  const at = config.indexOf("@");
  const questionMark = config.indexOf("?");
  const colon = config.indexOf(":");
  let part1 = "";
  let part2 = "";
  let part3 = "";
  let bucketName = "";

  // parse options
  let options: { [key: string]: string } = {};
  let optionsString = "";
  if (questionMark !== -1) {
    optionsString = config.substring(questionMark + 1);
    config = config.substring(0, questionMark);
    options = optionsString
      .split("&")
      .map(pair => pair.split("="))
      .reduce((acc, val) => {
        // acc[val[0]] = `${val[1]}`.valueOf();
        acc[val[0]] = val[1];
        return acc;
      }, {});
  }

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
    config = config.substring(0, at);
  }

  // get credentials
  if (colon !== -1) {
    [part1, part2] = config.split(":");
  } else {
    part1 = config;
  }

  // console.log(type, part1, part2, region, bucketName, options);
  return { type, part1, part2, part3, bucketName, options };
};

/**
 * @param s
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

export const parseMode = (s: number | string): number | string => {
  if (typeof s === "number") {
    if (s < 0) {
      throw new Error(
        `The argument 'mode' must be a 32-bit unsigned integer or an octal string. Received ${s}`
      );
    }
    return s;
  }
  if (s.startsWith("0o")) {
    return s.substring(2);
  }
  return s;
};

/**
 * @param: url
 * strips off the querystring of an url and returns it as an object
 */
export const getOptions = (url: string): { [id: string]: GenericKey } => {
  let options = {};
  const questionMark = url.indexOf("?");
  if (questionMark !== -1) {
    options = url
      .substring(questionMark + 1)
      .split("&")
      .map(pair => pair.split("="))
      .reduce((acc, val) => {
        // acc[val[0]] = `${val[1]}`.valueOf();
        acc[val[0]] = val[1];
        return acc;
      }, {});
  }
  return options;
};

/**
 * @param: url
 * strips off the protocol of an url and returns it
 */
export const getProtocol = (url: string): string => {
  return;
};

/**
 * @param url
 * @param doSlug
 *
 * Slugifies a url if the `slug` is true
 */
export const generateSlug = (url: string, slug: boolean | number | string): string => {
  if (!url || url === "null" || url === "undefined") {
    return "";
  }
  if (slug === "true" || slug === true || slug == 1) {
    const s = slugify(url);
    return s;
  }
  return url;
};

/**
 * @param p
 * @param settings
 *
 * Slugifies a path if `slug` is true
 */
export const slugifyPath = (p: string, slug: boolean): string => {
  if (slug === true) {
    const paths = p.split("/").map(d => slugify(d));
    return path.join(...paths);
  }
  return p;
};

export const validateName = (name: string): string => {
  if (name === null) {
    // throw new Error("Can not use `null` as bucket name");
    return "Can not use `null` as bucket name";
  }
  if (name === "null") {
    return 'Can not use "null" as bucket name';
  }
  if (name === "undefined") {
    return 'Can not use "undefined" as bucket name';
  }
  if (name === "" || typeof name === "undefined") {
    // throw new Error("Please provide a bucket name");
    return "Please provide a bucket name";
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
*/
