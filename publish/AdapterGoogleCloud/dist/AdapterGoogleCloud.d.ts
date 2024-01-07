import { Storage as GoogleCloudStorage } from "@google-cloud/storage";
import { AbstractAdapter } from "./AbstractAdapter";
import { Options, StreamOptions, StorageType } from "./types/general";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params";
import { ResultObject, ResultObjectBoolean, ResultObjectBuckets, ResultObjectFiles, ResultObjectNumber, ResultObjectStream } from "./types/result";
import { AdapterConfigGoogleCloud } from "./types/adapter_google_cloud";
export declare class AdapterGoogleCloud extends AbstractAdapter {
    protected _type: StorageType;
    protected _config: AdapterConfigGoogleCloud;
    protected _configError: string | null;
    protected _client: GoogleCloudStorage;
    constructor(config?: string | AdapterConfigGoogleCloud);
    private getFileSize;
    get config(): AdapterConfigGoogleCloud;
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
