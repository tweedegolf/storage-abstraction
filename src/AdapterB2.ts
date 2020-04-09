import fs from "fs";
import path from "path";
import to from "await-to-js";
import { Readable } from "stream";
import B2 from "backblaze-b2";
// require("@gideo-llc/backblaze-b2-upload-any").install(B2);
import {
  ConfigBackBlazeB2,
  BackBlazeB2Bucket,
  BackBlazeB2File,
  StorageType,
  IStorage,
} from "./types";
import { parseUrl } from "./util";

const state = {
  applicationKeyId: "",
  applicationKey: "",
  bucketName: "",
};

const init = async (): Promise<boolean> => {
  return true;
};

const getConfiguration = (): ConfigBackBlazeB2 => {
  return {
    type: StorageType.B2,
    applicationKeyId: "",
    applicationKey: "",
  };
};

const adapter: IStorage = {
  init,
  getType: () => StorageType.B2,
  getConfiguration,
};

const createAdapter = (config: ConfigBackBlazeB2): IStorage => {
  state.applicationKey = config.applicationKey;
  state.applicationKeyId = config.applicationKeyId;
  return adapter;
};

export { createAdapter };
