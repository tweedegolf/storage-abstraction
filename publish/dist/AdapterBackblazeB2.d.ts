/// <reference types="node" />
/// <reference types="node" />
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
import { StorageType, ConfigBackblazeB2 } from "./types";
export declare class AdapterBackblazeB2 extends AbstractAdapter {
    protected type: StorageType;
    private bucketId;
    private storage;
    private buckets;
    private files;
    private nextFileName;
    constructor(config: string | ConfigBackblazeB2);
    private parseConfig;
    init(): Promise<boolean>;
    private getBucketId;
    getFileAsReadable(name: string, options?: {
        start?: number;
        end?: number;
    }): Promise<Readable>;
    removeFile(name: string): Promise<string>;
    private findBucketLocal;
    private findBucket;
    getSelectedBucket(): string | null;
    protected store(buffer: Buffer, targetPath: string, options: object): Promise<string>;
    protected store(stream: Readable, targetPath: string, options: object): Promise<string>;
    protected store(origPath: string, targetPath: string, options: object): Promise<string>;
    createBucket(name: string, options?: object): Promise<string>;
    selectBucket(name: string): Promise<string>;
    clearBucket(name?: string): Promise<string>;
    deleteBucket(name?: string): Promise<string>;
    listBuckets(): Promise<string[]>;
    listFiles(numFiles?: number): Promise<[string, number][]>;
    private findFile;
    sizeOf(name: string): Promise<number>;
    fileExists(name: string): Promise<boolean>;
}
