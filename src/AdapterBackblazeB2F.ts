import fs from "fs";
import B2 from "backblaze-b2";

import { Options, StreamOptions, Provider, IAdapter } from "./types/general.ts";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params.ts";
import {
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectObject,
  ResultObjectStream,
} from "./types/result.ts";
import { AdapterConfigBackblazeB2 } from "./types/adapter_backblaze_b2.ts";

import { parseQueryString, validateName } from "./util.ts";

const getConfig = (): AdapterConfigBackblazeB2 => {
  return {
    provider: Provider.B2,
    applicationKeyId: "",
    applicationKey: "",
  };
};

const getProvider = (): Provider => Provider.B2;

const getConfigError = (): string => "string";

const getServiceClient = (): any => { }; // eslint-disable-line

const createBucket = async (name: string, options: Options = {}): Promise<ResultObject> => {
  const error = validateName(name, Provider.B2);
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
  params: FileBufferParams | FileStreamParams
): Promise<ResultObject> => {
  return { value: "public url", error: null };
};

const getFileAsStream = async (...args:
  [bucketName: string, fileName: string, options?: StreamOptions] |
  [fileName: string, options?: StreamOptions]): Promise<ResultObjectStream> => {
  return { value: fs.createReadStream(""), error: null };
};

const getPublicURL = async (...args:
  [bucketName: string, fileName: string, options?: Options] |
  [fileName: string, options?: Options]
): Promise<ResultObject> => {
  return Promise.resolve({ value: "url", error: null });
}

const getSignedURL = async (...args:
  [bucketName: string, fileName: string, options?: Options] |
  [fileName: string, options?: Options]
): Promise<ResultObject> => {
  return Promise.resolve({ value: "url", error: null });
}

const getPresignedUploadURL = async (...args:
  [bucketName: string, fileName: string, options?: Options] |
  [fileName: string, options?: Options]
): Promise<ResultObjectObject> => {
  return { value: {}, error: null }
}


const removeFile = async (...args:
  [bucketName: string, fileName: string] |
  [fileName: string]
): Promise<ResultObject> => {
  return { value: "ok", error: null };
};

const listFiles = async (...args:
  [bucketName?: string, numFiles?: number] |
  [numFiles?: number] |
  [bucketName?: string]): Promise<ResultObjectFiles> => {
  return { value: [["s", 0]], error: null };
};

const sizeOf = async (...args:
  [bucketName: string, fileName: string] |
  [fileName: string]): Promise<ResultObjectNumber> => {
  return { value: 42, error: null };
};

const fileExists = async (...args:
  [bucketName: string, fileName: string] |
  [fileName: string]): Promise<ResultObjectBoolean> => {
  return { value: true, error: null };
};

const bucketExists = async (bucketName?: string): Promise<ResultObjectBoolean> => {
  return { value: true, error: null };
};

const bucketIsPublic = async (bucketName?: string): Promise<ResultObjectBoolean> => {
  return { value: true, error: null };
};

const adapter: IAdapter = {
  get provider() {
    return getProvider();
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
    return "bucketName";
  },
  set bucketName(bucketName: string) { },
  get selectedBucket(): string {
    return "bucketName";
  },
  set selectedBucket(bucketName: string) { },
  setSelectedBucket(bucketName: string): void { },
  getSelectedBucket(): string {
    return "bucketName";
  },
  getProvider,
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
  getPublicURL,
  getSignedURL,
  getPresignedUploadURL,
  removeFile,
  listFiles,
  sizeOf,
  bucketExists,
  bucketIsPublic,
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
