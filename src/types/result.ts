import { Readable } from "stream";

export type ParseUrlResult = {
  error: string | null;
  value: {
    protocol: string;
    username: string;
    password: string;
    host: string;
    port: string;
    path: string;
    searchParams: { [key: string]: string };
  };
};

/**
 * Generic return type
 */
export interface ResultObject {
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

export type ResultObjectStream = {
  error: string | null;
  value: Readable | null;
};
