/// <reference types="node" />
/// <reference types="node" />
import { Readable } from "stream";
import { AdapterConfig, IStorage } from "./types";
export declare abstract class AbstractAdapter implements IStorage {
    protected type: string;
    protected config: AdapterConfig;
    protected bucketName: string;
    protected initialized: boolean;
    getType(): string;
    getConfiguration(): AdapterConfig;
    protected validateName(name: string): string;
    test(): Promise<string>;
    addFileFromPath(origPath: string, targetPath: string, options?: object): Promise<string>;
    addFileFromBuffer(buffer: Buffer, targetPath: string, options?: object): Promise<string>;
    addFileFromReadable(stream: Readable, targetPath: string, options?: object): Promise<string>;
    getSelectedBucket(): string;
    protected abstract store(filePath: string, targetFileName: string, options: object): Promise<string>;
    protected abstract store(buffer: Buffer, targetFileName: string, options: object): Promise<string>;
    protected abstract store(stream: Readable, targetFileName: string, options: object): Promise<string>;
    abstract init(): Promise<boolean>;
    abstract selectBucket(name: string | null): Promise<string>;
    abstract createBucket(name: string, options?: object): Promise<string>;
    abstract clearBucket(name?: string): Promise<string>;
    abstract deleteBucket(name?: string): Promise<string>;
    abstract listBuckets(): Promise<string[]>;
    abstract getFileAsReadable(name: string, options?: {
        start?: number;
        end?: number;
    }): Promise<Readable>;
    abstract removeFile(fileName: string): Promise<string>;
    abstract listFiles(): Promise<[string, number][]>;
    abstract sizeOf(name: string): Promise<number>;
    abstract fileExists(name: string): Promise<boolean>;
}
