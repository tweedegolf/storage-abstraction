import { AdapterConfig } from "./general.ts";

export interface AdapterConfigLocal extends AdapterConfig {
  directory: string;
  mode?: number;
}
