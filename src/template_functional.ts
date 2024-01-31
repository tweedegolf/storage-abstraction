import fs from "fs";
import { validateName } from "./util";
import { AdapterConfig, IAdapter, Options, StreamOptions } from "./types/general";
import {
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectStream,
} from "./types/result";
import { FilePathParams, FileBufferParams, FileStreamParams } from "./types/add_file_params";

/**
 * You can use this template as a starting point for your own functional adapter. You are
 * totally free in the way you setup your code as long as it exports a function with the name
 * `createAdapter()` that returns an object that should match the IStorage interface.
 *
 * You can use some util functions that are used in the class AbstractAdapter because they
 * are defined in a separate file ./src/util.ts
 */

const getType = (): string => "string";
const getConfig = (): AdapterConfig => ({}) as AdapterConfig;
const getConfigError = (): string | null => null;
const getServiceClient = (): any => "instance of your 3-rd party service client"; // eslint-disable-line
const getSelectedBucket = (): string => "the-buck";
const setSelectedBucket = (bucketName: string): void => {};

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

/**
 * arg1: bucketName or fileName
 * arg2: fileName or options
 * arg3: options
 */
const getFileAsURL = async (
  arg1: string,
  arg2?: string | Options,
  arg3?: Options
): Promise<ResultObject> => {
  return { value: "https://public.url", error: null };
};

/**
 * arg1: bucketName or fileName
 * arg2: fileName or options
 * arg3: options
 */
const getFileAsStream = async (
  arg1: string,
  arg2?: string | StreamOptions,
  arg3?: StreamOptions
): Promise<ResultObjectStream> => {
  return { value: fs.createReadStream(""), error: null };
};

/**
 * arg1: bucketName or fileName
 * arg2: fileName or options
 * arg3: options
 */
const removeFile = async (
  arg1: string,
  arg2?: string | boolean,
  arg3?: boolean
): Promise<ResultObject> => {
  return { value: "ok", error: null };
};

/**
 * arg1: bucketName or numFiles or undefined
 * arg2: numFiles or undefined
 */
const listFiles = async (arg1?: string | number, arg2?: number): Promise<ResultObjectFiles> => {
  return {
    value: [
      ["file.txt", 4000],
      ["img.jpg", 54000],
    ],
    error: null,
  };
};

/**
 * arg1: bucketName or fileName
 * arg2: fileName or undefined
 */
const sizeOf = async (arg1: string, arg2?: string): Promise<ResultObjectNumber> => {
  return { value: 42, error: null };
};

const bucketExists = async (bucketName?: string): Promise<ResultObjectBoolean> => {
  return { value: true, error: null };
};

/**
 * arg1: bucketName or fileName
 * arg2: fileName or undefined
 */
const fileExists = async (arg1: string, arg2?: string): Promise<ResultObjectBoolean> => {
  return { value: true, error: null };
};

const adapter: IAdapter = {
  getType,
  get type() {
    return this.getType();
  },
  getConfig,
  get config() {
    return getConfig();
  },
  getConfigError,
  get configError() {
    return getConfigError();
  },
  getServiceClient,
  get serviceClient() {
    return getServiceClient();
  },
  getSelectedBucket,
  get bucketName() {
    return getSelectedBucket();
  },
  setSelectedBucket(bucketName: string): void {
    this.bucketName = bucketName;
  },
  set(bucketName: string): void {
    setSelectedBucket(bucketName);
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

const createAdapter = (config: AdapterConfig): IAdapter => {
  console.log("create adapter", config);
  return adapter;
};

export { createAdapter };
