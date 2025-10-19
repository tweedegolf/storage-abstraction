import { Readable } from "stream";

export type ParseUrlResult = {
  error: null | string;
  value: null | {
    protocol: null | string;
    username: null | string;
    password: null | string;
    host: null | string;
    port: null | string;
    path: null | string;
    searchParams: null | { [key: string]: string };
  };
};

/**
 * Generic return type
 */
export interface ResultObject {
  // value: string | number | boolean | Array<string> | Array<[string, number]> | Readable | { [key: string]: any } | null;
  value: string | null;
  error: string | null;
}

export type ResultObjectNumber = {
  error: string | null;
  value: number | null;
};

export type ResultObjectBoolean = {
  error: string | null;
  value: boolean | null;
};

export type ResultObjectFiles = {
  error: string | null;
  value: Array<[string, number]> | null; // file name, file size
};

export type ResultObjectBuckets = {
  error: string | null;
  value: Array<string> | null;
};

export type ResultObjectStringArray = {
  error: string | null;
  value: Array<string> | null;
};

export type ResultObjectKeyValue = {
  error: string | null;
  value: { [key: string]: any } | null; // eslint-disable-line
};

export type ResultObjectObject = {
  error: string | null;
  value: { [key: string]: any } | null; // eslint-disable-line
  // value: any | null; // eslint-disable-line
};

export type ResultObjectStream = {
  error: string | null;
  value: Readable | null;
};
