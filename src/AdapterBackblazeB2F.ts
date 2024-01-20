import fs, { ReadStream } from "fs";
import { Readable } from "stream";
import B2 from "@nichoth/backblaze-b2";
require("@gideo-llc/backblaze-b2-upload-any").install(B2);

import { StorageType, IStorage, ConfigBackblazeB2, AdapterConfig, JSON as TypeJSON } from "./types";
import { parseUrl } from "./util";

const init = async (): Promise<boolean> => {
  return true;
};

const getConfiguration = (): ConfigBackblazeB2 => {
  return {
    type: StorageType.B2,
    applicationKeyId: "",
    applicationKey: "",
  };
};

// const init = (): Promise<boolean> => Promise.resolve(true);
const getType = (): string => "string";
// const getConfiguration = (): AdapterConfig => ({} as AdapterConfig);
const test = (): Promise<string> => Promise.resolve("ok");
const createBucket = (name: string): Promise<string> => Promise.resolve("ok");
const selectBucket = (name?: string | null): Promise<string> => Promise.resolve("ok");
const clearBucket = (name?: string): Promise<string> => Promise.resolve("ok");
const deleteBucket = (name?: string): Promise<string> => Promise.resolve("ok");
const listBuckets = (): Promise<string[]> => Promise.resolve(["string", "string"]);
const getSelectedBucket = (): string => "string";
const addFileFromPath = (origPath: string, targetPath: string, options?: object): Promise<string> =>
  Promise.resolve("public url");
const addFileFromBuffer = (buffer: Buffer, targetPath: string, options?: object): Promise<string> =>
  Promise.resolve("public url");
const addFileFromReadable = (
  stream: Readable,
  targetPath: string,
  options?: object
): Promise<string> => Promise.resolve("public url");
const getFileAsReadable = (
  name: string,
  options?: {
    start?: number;
    end?: number;
  }
): Promise<ReadStream> => Promise.resolve(fs.createReadStream(""));
const removeFile = (name: string): Promise<string> => Promise.resolve("ok");
const listFiles = (numFiles?: number): Promise<[string, number][]> => Promise.resolve([["s", 0]]);
const sizeOf = (name: string): Promise<number> => Promise.resolve(42);
const fileExists = (name: string): Promise<boolean> => Promise.resolve(true);

const adapter: IStorage = {
  init,
  getType: () => StorageType.B2,
  getConfiguration,
  test,
  createBucket,
  selectBucket,
  clearBucket,
  deleteBucket,
  listBuckets,
  getSelectedBucket,
  addFileFromPath,
  addFileFromBuffer,
  addFileFromReadable,
  getFileAsReadable,
  removeFile,
  listFiles,
  sizeOf,
  fileExists,
};

const createAdapter = (config: ConfigBackblazeB2): IStorage => {
  console.log("create functional adapter");
  const state = {
    applicationKeyId: config.applicationKeyId,
    applicationKey: config.applicationKey,
    bucketName: "",
  };

  return adapter;
};

export { createAdapter };
