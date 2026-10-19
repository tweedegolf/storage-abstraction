import { AdapterConfig } from "./general";

export interface AdapterConfigLocal extends AdapterConfig {
  directory: string;
  mode?: number;
}
