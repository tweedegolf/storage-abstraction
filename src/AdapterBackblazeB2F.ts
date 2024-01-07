import fs from "fs";
import B2 from "backblaze-b2";

import {
  StorageType,
  IStorage,
  ResultObject,
  ResultObjectBuckets,
  FileBufferParams,
  FilePathParams,
  FileStreamParams,
  ResultObjectStream,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectBoolean,
  AdapterConfig,
  Options,
  StreamOptions,
} from "./types";
import { parseUrl, validateName } from "./util";

const getConfiguration = (): AdapterConfig => {
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

const adapter: IStorage = {
  get type() {
    return getType();
  },
  get config() {
    return getConfiguration();
  },
  get configError() {
    return getConfigError();
  },
  get serviceClient() {
    return getServiceClient();
  },
  getType,
  getConfigError,
  getConfiguration,
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

const createAdapter = (config: AdapterConfig | string): IStorage => {
  console.log("create functional adapter");

  let configError = null;
  if (typeof config === "string") {
    const { value, error } = parseUrl(config);
    if (error) {
      configError = `[configError] ${error}`;
    }
    config = value;
  }

  const state = {
    applicationKeyId: config.applicationKeyId,
    applicationKey: config.applicationKey,
    configError,
  };

  return adapter;
};

export { createAdapter };
