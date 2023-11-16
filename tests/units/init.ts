import { Storage } from "../../src/Storage";
import { ConfigAmazonS3, IAdapterConfig } from "../../src/types";
import { getConfiguration } from "./get_configuration";

const debug = false;

export async function init(): Promise<Storage> {
  const config = getConfiguration();
  try {
    const storage = new Storage(config);
    await storage.init();
    if (debug) {
      console.log(storage.getConfiguration());
    }
    return storage;
  } catch (e) {
    console.error(`\x1b[31m[init] ${e.message}`);
    process.exit(0);
  }
}

export async function initSkipCheck(): Promise<Storage> {
  const config = getConfiguration() as ConfigAmazonS3;
  try {
    const storage = new Storage({
      skipCheck: true,
      type: config.type,
      region: config.region,
    } as IAdapterConfig);
    await storage.init();
    if (debug) {
      console.log(storage.getConfiguration());
    }
    return storage;
  } catch (e) {
    console.error(`\x1b[31m[initSkipCheck] ${e.message}`);
    process.exit(0);
  }
}
