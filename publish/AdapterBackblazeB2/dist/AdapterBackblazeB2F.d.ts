import { IStorage, AdapterConfig } from "./types";
declare const createAdapter: (config: AdapterConfig | string) => IStorage;
export { createAdapter };
