import { ParseUrlResult, ResultObjectNumber } from "./types/result";
export declare const getErrorMessage: (error: unknown) => string;
/**
 * @param {string} url
 * strips off the querystring of an url and returns it as an object
 */
export declare const parseQueryString: (url: string) => {
    [id: string]: string;
};
/**
 * @param {string} url
 * Parses a config url string into fragments and parses the query string into a
 * key-value object.
 */
export declare const parseUrlStandard: (url: string, checkType?: boolean) => ParseUrlResult;
/**
 * @param {string} url
 * Parses a config url string into fragments and parses the query string into a
 * key-value object.
 */
export declare const parseUrl: (url: string, checkType?: boolean) => ParseUrlResult;
/**
 * @param {string} s
 *
 * Parses a string that contains a radix prefix to a number
 *
 */
export declare const parseIntFromString: (s: string) => number;
export declare const parseMode: (mode: number | string) => ResultObjectNumber;
/**
 * @param {string} str
 *
 * Checks if the value of the name is not null or undefined
 */
export declare const isBlankString: (str: string) => boolean;
/**
 * @param {string} name
 *
 * Checks if the value of the name is not null, undefined or an empty string
 */
export declare const validateName: (name: string, type: string) => null | string;
