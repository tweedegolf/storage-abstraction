import { Readable, Stream, Writable } from "stream";
import { ResultObject, ResultObjectBoolean, ResultObjectBuckets, ResultObjectFiles, ResultObjectNumber, ResultObjectObject, ResultObjectStream } from "../src/types/result";
import { Options } from "../src/types/general";
/**
 * Utility function that connects a read-stream (from the storage) to a write-stream (to a local file)
 */
export declare const saveFile: (readStream: Readable, writeStream: Writable, log?: boolean) => Promise<void>;
export declare function streamToString(stream: Readable): Promise<unknown>;
export declare function timeout(millis: number): Promise<void>;
export declare function stream2buffer(stream: Stream): Promise<Buffer>;
export declare enum Color {
    MESSAGE = "96m",
    ERROR = "91m",
    TEST = "35m",
    OK = "32m"
}
export declare function colorLog(label: string, color: Color, ...msg: any[]): void;
export type ResultObjectType = ResultObject | ResultObjectBoolean | ResultObjectNumber | ResultObjectStream | ResultObjectBuckets | ResultObjectObject | ResultObjectFiles;
export declare function logResult(label: string, result: ResultObjectType, msg?: string, options?: Options): void;
export declare const getSha1ForFile: (filePath: string) => Promise<string>;
export declare const privateBucket = "sab-test-private";
export declare const publicBucket = "sab-test-public";
export declare function getPrivateBucketName(type: string): string;
export declare function getPublicBucketName(type: string): string;
