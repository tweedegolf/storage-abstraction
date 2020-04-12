import { IAdapterConfig } from "../../src/types";

export interface ConfigGoogleCloud extends IAdapterConfig {
  keyFilename: string;
  projectId?: string;
}
