import fs from "fs";
import path from "path";
import to from "await-to-js";
import { Readable } from "stream";
import B2 from "backblaze-b2";
// require("@gideo-llc/backblaze-b2-upload-any").install(B2);
import { StorageType, IStorage } from "../../src/types";
import { parseUrl } from "../../src/util";
import { ConfigBackBlazeB2 } from "./types";

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
  console.log("create adapter");
  const state = {
    applicationKeyId: config.applicationKeyId,
    applicationKey: config.applicationKey,
    bucketName: "",
  };

  return adapter;
};

export { createAdapter };
