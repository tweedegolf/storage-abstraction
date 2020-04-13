import fs, { ReadStream } from "fs";
import { AdapterConfig, UploadOptions, IStorage, JSON as TypeJSON } from "./types";
import { Readable } from "stream";

const init = (): Promise<boolean> => Promise.resolve(true);
const getType = (): string => "string";
const getConfiguration = (): AdapterConfig => ({} as AdapterConfig);
const getOptions = (): TypeJSON => ({});
const test = (): Promise<string> => Promise.resolve("ok");
const createBucket = (name: string): Promise<string> => Promise.resolve("ok");
const selectBucket = (name?: string | null): Promise<void> => Promise.resolve();
const clearBucket = (name?: string): Promise<void> => Promise.resolve();
const deleteBucket = (name?: string): Promise<void> => Promise.resolve();
const listBuckets = (): Promise<string[]> => Promise.resolve(["string", "string"]);
const getSelectedBucket = (): string => "string";
const addFileFromPath = (origPath: string, targetPath: string): Promise<void> => Promise.resolve();
const addFileFromBuffer = (buffer: Buffer, targetPath: string): Promise<void> => Promise.resolve();
const addFileFromReadable = (
  stream: Readable,
  targetPath: string,
  options?: UploadOptions
): Promise<void> => Promise.resolve();
const getFileAsReadable = (
  name: string,
  options?: {
    start?: number;
    end?: number;
  }
): Promise<ReadStream> => Promise.resolve(fs.createReadStream(""));
const removeFile = (name: string): Promise<void> => Promise.resolve();
const listFiles = (numFiles?: number): Promise<[string, number][]> => Promise.resolve([["s", 0]]);
const sizeOf = (name: string): Promise<number> => Promise.resolve(42);
const fileExists = (name: string): Promise<boolean> => Promise.resolve(true);

const adapter: IStorage = {
  init,
  getType,
  getConfiguration,
  getOptions,
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

const createAdapter = (config: AdapterConfig): IStorage => {
  console.log("create adapter");
  return adapter;
};

export { createAdapter };
