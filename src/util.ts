import { URL } from "url";
import { StorageType } from "./types/general";
import { ParseUrlResult, ResultObjectNumber } from "./types/result";

/**
 * @param {string} url
 * strips off the querystring of an url and returns it as an object
 */
export const parseQueryString = (url: string): { [id: string]: string } => {
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
 * @param {string} url
 * Parses a config url string into fragments and parses the query string into a
 * key-value object.
 */
export const parseUrlStandard = (url: string, checkType = false): ParseUrlResult => {
  let parsed = null;
  let searchParams = null;

  if (isBlankString(url)) {
    return {
      value: null,
      error: "please provide a configuration url",
    };
  }

  try {
    parsed = new URL(url);
  } catch (e) {
    return { value: null, error: e.message };
  }

  if (Object.keys(parsed.searchParams)) {
    searchParams = {};
    for (const [key, val] of parsed.searchParams) {
      searchParams[key] = val;
    }
  }

  return {
    value: {
      protocol: parsed.protocol || null,
      username: parsed.username || null,
      password: parsed.password || null,
      host: parsed.host || null,
      port: parsed.port || null,
      path: parsed.path || null,
      searchParams,
    },
    error: null,
  };
};

/**
 * @param {string} url
 * Parses a config url string into fragments and parses the query string into a
 * key-value object.
 */
export const parseUrl = (url: string, checkType = false): ParseUrlResult => {
  let protocol = null;
  let username = null;
  let password = null;
  let port = null;
  let path = null;
  let host = null;
  let searchParams = null;

  if (isBlankString(url)) {
    return {
      value: null,
      error: "please provide a configuration url",
    };
  }

  const p = url.indexOf("://");
  if (p === -1) {
    return {
      value: { protocol: url, username, password, host, port, path, searchParams },
      error: null,
    };
  }
  protocol = url.substring(0, p);
  if (
    checkType === true &&
    Object.values(StorageType).includes(protocol as StorageType) === false
  ) {
    return { value: null, error: `"${protocol}" is not a valid storage type` };
  }

  let config = url.substring(p + 3);
  const at = config.indexOf("@");
  const questionMark = config.indexOf("?");

  // parse options
  if (questionMark !== -1) {
    searchParams = parseQueryString(url);
    config = config.substring(0, questionMark);
  }

  // get host (bucket name)
  if (at !== -1) {
    host = config.substring(at + 1);
    // remove port
    const colon = host.indexOf(":");
    if (colon !== -1) {
      port = host.substring(colon + 1);
      host = host.substring(0, colon);
    }
    // console.log(colon, port);
    if (questionMark !== -1) {
      host = host.substring(0, questionMark);
    }
    if (isBlankString(host)) {
      host = null;
    }
    config = config.substring(0, at);
  }

  // get credentials
  const colon = config.indexOf(":");
  if (colon !== -1) {
    if (port === null) {
      [username, password, port] = config.split(":");
      if (typeof port === "undefined") {
        port = null;
      }
    } else {
      [username, password] = config.split(":");
    }
  } else if (config !== "") {
    username = config;
  }

  // remove path from port in case it hasn't been removed
  if (port !== null) {
    const slash = port.indexOf("/");
    if (slash !== -1) {
      path = port.substring(slash + 1);
      port = port.substring(0, slash);
    }
  }

  // remove path from bucketName in case it hasn't been removed
  if (host !== null) {
    const slash = host.indexOf("/");
    if (slash !== -1) {
      path = host.substring(slash + 1);
      host = host.substring(0, slash);
    }
  }

  return {
    value: { protocol, username, password, host, port, path, searchParams },
    error: null,
  };
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
