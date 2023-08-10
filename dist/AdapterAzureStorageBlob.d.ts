/// <reference types="node" />
/// <reference types="node" />
import { Readable } from "stream";
import { AbstractAdapter } from "./AbstractAdapter";
import { ConfigAzureStorageBlob, StorageType } from "./types";
import { CreateReadStreamOptions } from "@google-cloud/storage";
export declare class AdapterAzureStorageBlob extends AbstractAdapter {
    protected type: StorageType;
    private storage;
    private bucketNames;
    private sharedKeyCredential;
    constructor(config: string | ConfigAzureStorageBlob);
    private parseConfig;
    init(): Promise<boolean>;
    getFileAsReadable(fileName: string, options?: CreateReadStreamOptions): Promise<Readable>;
    getFileAsURL(fileName: string): Promise<string>;
    selectBucket(name: string | null): Promise<string>;
    createBucket(name: string, options?: object): Promise<string>;
    clearBucket(name?: string): Promise<string>;
    deleteBucket(name?: string): Promise<string>;
    listBuckets(): Promise<string[]>;
    listFiles(): Promise<[string, number][]>;
    removeFile(fileName: string): Promise<string>;
    sizeOf(name: string): Promise<number>;
    fileExists(name: string): Promise<boolean>;
    protected store(buffer: Buffer, targetPath: string, options: object): Promise<string>;
    protected store(stream: Readable, targetPath: string, options: object): Promise<string>;
    protected store(origPath: string, targetPath: string, options: object): Promise<string>;
}
