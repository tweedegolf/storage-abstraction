import { IAdapter } from "./types/general";
import { AdapterConfigBackblazeB2 } from "./types/adapter_backblaze_b2";
declare const createAdapter: (config: string | AdapterConfigBackblazeB2) => IAdapter;
export { createAdapter };
