/// <reference types="node" />
/// <reference types="node" />
import { Readable } from "stream";
import { File, CreateReadStreamOptions } from "@google-cloud/storage";
import { AbstractAdapter } from "./AbstractAdapter";
import { StorageType, ConfigGoogleCloud } from "./types";
export declare class AdapterGoogleCloudStorage extends AbstractAdapter {
    protected type: StorageType;
    private bucketNames;
    private storage;
    constructor(config: string | ConfigGoogleCloud);
    /**
     * @param {string} keyFile - path to the keyFile
     *
     * Read in the keyFile and retrieve the projectId, this is function
     * is called when the user did not provide a projectId
     */
    private getGCSProjectId;
    private parseConfig;
    init(): Promise<boolean>;
    getFile(fileName: string, retries?: number): Promise<File>;
    getFileAsReadable(fileName: string, options?: CreateReadStreamOptions): Promise<Readable>;
    downloadFile(fileName: string, downloadPath: string): Promise<void>;
    removeFile(fileName: string): Promise<string>;
    protected store(buffer: Buffer, targetPath: string, options: object): Promise<string>;
    protected store(stream: Readable, targetPath: string, options: object): Promise<string>;
    protected store(origPath: string, targetPath: string, options: object): Promise<string>;
    createBucket(name: string, options?: object): Promise<string>;
    selectBucket(name: string | null): Promise<string>;
    clearBucket(name?: string): Promise<string>;
    deleteBucket(name?: string): Promise<string>;
    listBuckets(): Promise<string[]>;
    private getMetaData;
    listFiles(numFiles?: number): Promise<[string, number][]>;
    sizeOf(name: string): Promise<number>;
    fileExists(name: string): Promise<boolean>;
}
