import fs from "fs";
import B2 from "backblaze-b2";

import { Options, StreamOptions, StorageType, IAdapter } from "./types/general";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params";
import {
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectKeyValue,
  ResultObjectNumber,
  ResultObjectStream,
} from "./types/result";
import {
  AdapterConfigBackblazeB2,
  FileB2,
  ResultObjectBucketB2,
  ResultObjectBucketsB2,
  ResultObjectFileB2,
  ResultObjectFilesB2,
} from "./types/adapter_backblaze_b2";

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

const clearBucket = async (name: string): Promise<ResultObject> => {
  return { value: "ok", error: null };
};

const deleteBucket = async (name: string): Promise<ResultObject> => {
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
  bucketName: string,
  fileName: string,
  options?: StreamOptions
): Promise<ResultObjectStream> => {
  return { value: fs.createReadStream(""), error: null };
};

const getFileAsURL = async (
  bucketName: string,
  fileName: string,
  options?: Options
): Promise<ResultObject> => {
  return { value: "url", error: null };
};

const removeFile = async (bucketName: string, fileName: string): Promise<ResultObject> => {
  return { value: "ok", error: null };
};

const listFiles = async (bucketName: string, numFiles?: number): Promise<ResultObjectFiles> => {
  return { value: [["s", 0]], error: null };
};

const sizeOf = async (bucketName: string, fileName: string): Promise<ResultObjectNumber> => {
  return { value: 42, error: null };
};

const fileExists = async (bucketName: string, fileName: string): Promise<ResultObjectBoolean> => {
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
