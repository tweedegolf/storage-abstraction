/// <reference types="node" />
/// <reference types="node" />
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
import { AdapterConfig, StorageType } from "./types";
export declare class AdapterAmazonS3 extends AbstractAdapter {
    protected type: StorageType;
    private storage;
    private bucketNames;
    private region;
    constructor(config: string | AdapterConfig);
    init(): Promise<boolean>;
    private parseConfig;
    getFileAsReadable(fileName: string, options?: {
        start?: number;
        end?: number;
    }): Promise<Readable>;
    removeFile(fileName: string): Promise<string>;
    createBucket(name: string, options?: object): Promise<string>;
    selectBucket(name: string | null): Promise<string>;
    clearBucket(name?: string): Promise<string>;
    deleteBucket(name?: string): Promise<string>;
    listBuckets(): Promise<string[]>;
    protected store(buffer: Buffer, targetPath: string, options: object): Promise<string>;
    protected store(stream: Readable, targetPath: string, options: object): Promise<string>;
    protected store(origPath: string, targetPath: string, options: object): Promise<string>;
    listFiles(maxFiles?: number): Promise<[string, number][]>;
    sizeOf(name: string): Promise<number>;
    fileExists(name: string): Promise<boolean>;
}
