import fs from "fs";
import {
  AdapterConfig,
  FileBufferParams,
  FilePathParams,
  FileStreamParams,
  IStorage,
  Options,
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectStream,
  StreamOptions,
} from "./types";
import { validateName } from "./util";

/**
 * You can use this template as a starting point for your own functional adapter. You are
 * totally free in the way you setup your code as long as it exports a function with the name
 * `createAdapter()` that returns an object that should match the IStorage interface.
 *
 * You can use some util functions that are used in the class AbstractAdapter because they
 * are defined in a separate file ./src/util.ts
 */

const getType = (): string => "string";
const getConfiguration = (): AdapterConfig => ({}) as AdapterConfig;
const getConfigError = (): string | null => null;
const getServiceClient = (): any => "instance of your 3-rd party service client"; // eslint-disable-line

const createBucket = async (name: string): Promise<ResultObject> => {
  // Usually your cloud service will check if a valid bucket name has been provided.
  // However, in general `null`, `undefined` and empty strings are not allowed (nor desirable)
  // so you may want to perform this check locally using the validateName function in ./src/util.ts
  const error = validateName(name);
  if (error !== null) {
    return { value: null, error };
  }
  return { value: "ok", error: null };
};

const clearBucket = async (name: string): Promise<ResultObject> => {
  return { value: "ok", error: null };
};

const deleteBucket = async (name: string): Promise<ResultObject> => {
  return { value: "ok", error: null };
};

const listBuckets = async (): Promise<ResultObjectBuckets> => {
  return { value: ["bucket1", "bucket2"], error: null };
};

const addFileFromPath = async (params: FilePathParams): Promise<ResultObject> => ({
  value: "https://public.url",
  error: null,
});

const addFileFromBuffer = async (params: FileBufferParams): Promise<ResultObject> => ({
  value: "https://public.url",
  error: null,
});

const addFileFromStream = async (params: FileStreamParams): Promise<ResultObject> => ({
  value: "https://public.url",
  error: null,
});

const addFile = async (
  params: FileStreamParams | FileBufferParams | FileStreamParams
): Promise<ResultObject> => ({
  value: "https://public.url",
  error: null,
});

const getFileAsURL = async (
  bucketName: string,
  fileName: string,
  options?: Options
): Promise<ResultObject> => {
  return { value: "https://public.url", error: null };
};

const getFileAsStream = async (
  bucketName: string,
  fileName: string,
  options?: StreamOptions
): Promise<ResultObjectStream> => {
  return { value: fs.createReadStream(""), error: null };
};

const removeFile = async (bucketName: string, fileName: string): Promise<ResultObject> => {
  return { value: "ok", error: null };
};

const listFiles = async (bucketName: string, numFiles?: number): Promise<ResultObjectFiles> => {
  return {
    value: [
      ["file.txt", 4000],
      ["img.jpg", 54000],
    ],
    error: null,
  };
};

const sizeOf = async (bucketName: string, fileName: string): Promise<ResultObjectNumber> => {
  return { value: 42, error: null };
};

const bucketExists = async (name: string): Promise<ResultObjectBoolean> => {
  return { value: true, error: null };
};

const fileExists = async (bucketName: string, fileName: string): Promise<ResultObjectBoolean> => {
  return { value: true, error: null };
};

const adapter: IStorage = {
  getType,
  get type() {
    return this.getType();
  },
  getConfiguration,
  get config() {
    return getConfiguration();
  },
  getConfigError,
  get configError() {
    return getConfigError();
  },
  getServiceClient,
  get serviceClient() {
    return getServiceClient();
  },
  createBucket,
  clearBucket,
  deleteBucket,
  listBuckets,
  addFile,
  addFileFromPath,
  addFileFromBuffer,
  addFileFromStream,
  getFileAsURL,
  getFileAsStream,
  removeFile,
  listFiles,
  sizeOf,
  fileExists,
  bucketExists,
};

const createAdapter = (config: AdapterConfig): IStorage => {
  console.log("create adapter");
  return adapter;
};

export { createAdapter };
