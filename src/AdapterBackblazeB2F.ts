import fs from "fs";
import B2 from "@nichoth/backblaze-b2";

import { Options, StreamOptions, StorageType, IAdapter } from "./types/general";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params";
import {
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectStream,
} from "./types/result";
import { AdapterConfigBackblazeB2 } from "./types/adapter_backblaze_b2";

import { parseQueryString, parseUrl, validateName } from "./util";

const getConfig = (): AdapterConfigBackblazeB2 => {
  return {
    type: StorageType.B2,
    applicationKeyId: "",
    applicationKey: "",
  };
};

const getType = (): string => "string";

const getConfigError = (): string => "string";

const getServiceClient = (): any => {}; // eslint-disable-line

const createBucket = async (name: string, options?: Options): Promise<ResultObject> => {
  const error = validateName(name);
  if (error !== null) {
    return { value: null, error };
  }
  return { value: "ok", error: null };
};

const clearBucket = async (name?: string): Promise<ResultObject> => {
  return { value: "ok", error: null };
};

const deleteBucket = async (name?: string): Promise<ResultObject> => {
  return { value: "ok", error: null };
};

const listBuckets = async (): Promise<ResultObjectBuckets> => {
  return { value: ["string", "string"], error: null };
};

const addFileFromPath = async (params: FilePathParams): Promise<ResultObject> => {
  return { value: "public url", error: null };
};

const addFileFromBuffer = async (params: FileBufferParams): Promise<ResultObject> => {
  return { value: "public url", error: null };
};

const addFileFromStream = async (params: FileStreamParams): Promise<ResultObject> => {
  return { value: "public url", error: null };
};

const addFile = async (
  params: FilePathParams | FileBufferParams | FileStreamParams
): Promise<ResultObject> => {
  return { value: "public url", error: null };
};

const getFileAsStream = async (
  arg1: string,
  arg2: StreamOptions | string,
  arg3?: StreamOptions
): Promise<ResultObjectStream> => {
  return { value: fs.createReadStream(""), error: null };
};

const getFileAsURL = async (
  arg1: string,
  arg2: Options | string,
  arg3?: Options
): Promise<ResultObject> => {
  return { value: "url", error: null };
};

const removeFile = async (
  arg1: string,
  arg2?: boolean | string,
  arg3?: boolean
): Promise<ResultObject> => {
  return { value: "ok", error: null };
};

const listFiles = async (arg1: number | string, arg2?: number): Promise<ResultObjectFiles> => {
  return { value: [["s", 0]], error: null };
};

const sizeOf = async (bucketName: string, fileName: string): Promise<ResultObjectNumber> => {
  return { value: 42, error: null };
};

const fileExists = async (bucketName: string, fileName?: string): Promise<ResultObjectBoolean> => {
  return { value: true, error: null };
};

const bucketExists = async (bucketName: string): Promise<ResultObjectBoolean> => {
  return { value: true, error: null };
};

const adapter: IAdapter = {
  get type() {
    return getType();
  },
  get config() {
    return getConfig();
  },
  get configError() {
    return getConfigError();
  },
  get serviceClient() {
    return getServiceClient();
  },
  get bucketName() {
    return getServiceClient();
  },
  set(bucketName: string): void {},
  setSelectedBucket(bucketName: string): void {},
  getSelectedBucket(): string {
    return "bucketName";
  },
  getType,
  getConfigError,
  getConfig,
  getServiceClient,
  createBucket,
  clearBucket,
  deleteBucket,
  listBuckets,
  addFile,
  addFileFromPath,
  addFileFromBuffer,
  addFileFromStream,
  getFileAsStream,
  getFileAsURL,
  removeFile,
  listFiles,
  sizeOf,
  bucketExists,
  fileExists,
};

const createAdapter = (config: string | AdapterConfigBackblazeB2): IAdapter => {
  console.log("create functional adapter");
  const configError = null;
  let conf: AdapterConfigBackblazeB2;
  if (typeof config === "string") {
    conf = parseQueryString(config) as AdapterConfigBackblazeB2;
  } else {
    conf = { ...config };
  }

  const state = {
    applicationKey: conf.applicationKey,
    applicationKeyId: conf.applicationKeyId,
    configError,
  };

  return adapter;
};

export { createAdapter };
