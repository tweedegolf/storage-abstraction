import { Storage as GoogleCloudStorage } from "@google-cloud/storage";
import { AbstractAdapter } from "./AbstractAdapter";
import { StorageType, ResultObject, ResultObjectStream, FileBufferParams, FilePathParams, FileStreamParams, ResultObjectBuckets, ResultObjectFiles, ResultObjectNumber, ResultObjectBoolean, AdapterConfigGoogle, Options, StreamOptions } from "./types";
export declare class AdapterGoogleCloud extends AbstractAdapter {
    protected _type: StorageType;
    protected _config: AdapterConfigGoogle;
    protected _configError: string | null;
    protected _client: GoogleCloudStorage;
    constructor(config?: string | AdapterConfigGoogle);
    private getFileSize;
    get config(): AdapterConfigGoogle;
    get serviceClient(): GoogleCloudStorage;
    getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject>;
    getFileAsStream(bucketName: string, fileName: string, options?: StreamOptions): Promise<ResultObjectStream>;
    removeFile(bucketName: string, fileName: string): Promise<ResultObject>;
    addFile(params: FilePathParams | FileBufferParams | FileStreamParams): Promise<ResultObject>;
    createBucket(name: string, options?: Options): Promise<ResultObject>;
    clearBucket(name: string): Promise<ResultObject>;
    deleteBucket(name: string): Promise<ResultObject>;
    listBuckets(): Promise<ResultObjectBuckets>;
    listFiles(bucketName: string, numFiles?: number): Promise<ResultObjectFiles>;
    sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;
    bucketExists(name: string): Promise<ResultObjectBoolean>;
    fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>;
}
