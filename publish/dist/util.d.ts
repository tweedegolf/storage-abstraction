import { ParseUrlResult, ResultObjectNumber } from "./types/result";
/**
 * @param: url
 *
 * strips off the querystring of an url and returns it as an object
 */
export declare const parseQuerystring: (url: string) => {
    [id: string]: string;
};
/**
 * @param url
 * Parses a url into a key-value object.
 */
export declare const parseUrl: (url: string) => ParseUrlResult;
/**
 * @param {string} s
 *
 * Parses a string that contains a radix prefix to a number
 *
 */
export declare const parseIntFromString: (s: string) => number;
export declare const parseMode: (mode: number | string) => ResultObjectNumber;
/**
 * @param {string} url
 *
 * strips off the protocol of an url and returns it
 */
export declare const getProtocol: (url: string) => string;
/**
 * @param {string} name
 *
 * Checks if the value of the name is not null or undefined
 */
export declare const isBlankString: (str: string) => boolean;
/**
 * @param {string} name
 *
 * Checks if the value of the name is not null, undefined or an empty string
 */
export declare const validateName: (name: string) => string;
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
