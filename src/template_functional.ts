import fs, { ReadStream } from "fs";
import { AdapterConfig, IStorage, JSON as TypeJSON } from "./types";
import { Readable } from "stream";

/**
 * You can use this template as a starting point for your own functional adapter. You are
 * totally free in the way you setup your code as long as it exports function with the name
 * `createAdapter()` that returns an object that should match the IStorage interface.
 *
 * You can use some util functions that are used in the class AbstractAdapter because they
 * are imported from ./util.js where they are defined.
 */

const init = (): Promise<boolean> => Promise.resolve(true);
const getType = (): string => "string";
const getConfiguration = (): AdapterConfig => ({} as AdapterConfig);
const test = (): Promise<string> => Promise.resolve("ok");
const createBucket = (name: string): Promise<string> => Promise.resolve("bucket created");
const selectBucket = (name?: string | null): Promise<string> => Promise.resolve("bucket selected");
const clearBucket = (name?: string): Promise<string> => Promise.resolve("bucket cleared");
const deleteBucket = (name?: string): Promise<string> => Promise.resolve("bucket deleted");
const listBuckets = (): Promise<string[]> => Promise.resolve(["string", "string"]);
const getSelectedBucket = (): string => "string";
const addFileFromPath = (origPath: string, targetPath: string, options?: object): Promise<void> =>
  Promise.resolve();
const addFileFromBuffer = (buffer: Buffer, targetPath: string, options?: object): Promise<void> =>
  Promise.resolve();
const addFileFromReadable = (
  stream: Readable,
  targetPath: string,
  options?: object
): Promise<void> => Promise.resolve();
const getFileAsReadable = (
  name: string,
  options?: {
    start?: number;
    end?: number;
  }
): Promise<ReadStream> => Promise.resolve(fs.createReadStream(""));
const removeFile = (name: string): Promise<string> => Promise.resolve("file removed");
const listFiles = (numFiles?: number): Promise<[string, number][]> => Promise.resolve([["s", 0]]);
const sizeOf = (name: string): Promise<number> => Promise.resolve(42);
const fileExists = (name: string): Promise<boolean> => Promise.resolve(true);

const adapter: IStorage = {
  init,
  getType,
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

const createAdapter = (config: AdapterConfig): IStorage => {
  console.log("create adapter");
  return adapter;
};

export { createAdapter };
