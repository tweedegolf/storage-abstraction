/// <reference types="node" />
/// <reference types="node" />
import { Readable } from "stream";
import { StorageType, ConfigLocal } from "./types";
import { AbstractAdapter } from "./AbstractAdapter";
export declare class AdapterLocal extends AbstractAdapter {
    protected type: StorageType;
    private directory;
    private buckets;
    private mode;
    constructor(config: ConfigLocal);
    private parseConfig;
    init(): Promise<boolean>;
    /**
     * @param path
     * creates a directory if it doesn't exist
     */
    private createDirectory;
    protected store(buffer: Buffer, targetPath: string): Promise<string>;
    protected store(stream: Readable, targetPath: string): Promise<string>;
    protected store(filePath: string, targetPath: string): Promise<string>;
    createBucket(name: string): Promise<string>;
    clearBucket(name?: string): Promise<string>;
    deleteBucket(name?: string): Promise<string>;
    selectBucket(name?: string | null): Promise<string>;
    listBuckets(): Promise<string[]>;
    private globFiles;
    listFiles(): Promise<[string, number][]>;
    getFileAsReadable(name: string, options?: {
        start?: number;
        end?: number;
    }): Promise<Readable>;
    removeFile(fileName: string): Promise<string>;
    sizeOf(name: string): Promise<number>;
    fileExists(name: string): Promise<boolean>;
}
