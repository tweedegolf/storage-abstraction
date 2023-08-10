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
 * Parses a url string into fragments and parses the query string into a
 * key-value object.
 */
export declare const parseUrl: (url: string) => {
    type: string;
    part1: string;
    part2: string;
    part3: string;
    bucketName: string;
    queryString: {
        [key: string]: string;
    };
};
/**
 * @param s
 *
 * Parses a string that contains a radix prefix to a number
 *
 */
export declare const parseIntFromString: (s: string) => number;
export declare const parseMode: (s: number | string) => number | string;
/**
 * @param: url
 *
 * strips off the protocol of an url and returns it
 */
export declare const getProtocol: (url: string) => string;
/**
 * @param name
 *
 * Checks if the value of the name is not null or undefined
 */
export declare const validateName: (name: string) => string;
