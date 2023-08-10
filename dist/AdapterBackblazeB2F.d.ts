import { IStorage, ConfigBackblazeB2 } from "./types";
declare const createAdapter: (config: ConfigBackblazeB2) => IStorage;
export { createAdapter };
