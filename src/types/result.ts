import { Readable } from "stream";

export type ParseUrlResult = {
  error: string | null;
  value: {
    type: string;
    part1: string;
    part2: string;
    bucketName: string;
    extraOptions: { [key: string]: string };
  };
};

export interface ResultObject {
  error: string | null;
  value: string | null;
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
