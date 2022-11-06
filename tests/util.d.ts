import { Readable, Writable } from "stream";
/**
 * Utility function that connects a read-stream (from the storage) to a write-stream (to a local file)
 */
export declare const copyFile: (readStream: Readable, writeStream: Writable, log?: boolean) => Promise<void>;
export declare const promiseRimraf: (path: string) => Promise<boolean>;
