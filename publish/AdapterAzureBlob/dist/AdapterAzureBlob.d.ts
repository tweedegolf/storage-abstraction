import { AbstractAdapter } from "./AbstractAdapter";
import { BlobServiceClient } from "@azure/storage-blob";
import { StorageType, ResultObjectStream, ResultObject, ResultObjectBuckets, ResultObjectFiles, ResultObjectNumber, ResultObjectBoolean, FileBufferParams, FilePathParams, FileStreamParams, AdapterConfigAzure, Options, StreamOptions } from "./types";
export declare class AdapterAzureBlob extends AbstractAdapter {
    protected _type: StorageType;
    protected _config: AdapterConfigAzure;
    protected _configError: string | null;
    protected _client: BlobServiceClient;
    private sharedKeyCredential;
    constructor(config: string | AdapterConfigAzure);
    get config(): AdapterConfigAzure;
    get serviceClient(): BlobServiceClient;
    getFileAsStream(bucketName: string, fileName: string, options?: StreamOptions): Promise<ResultObjectStream>;
    getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject>;
    createBucket(name: string, options?: Options): Promise<ResultObject>;
    clearBucket(name: string): Promise<ResultObject>;
    deleteBucket(name: string): Promise<ResultObject>;
    listBuckets(): Promise<ResultObjectBuckets>;
    listFiles(bucketName: string): Promise<ResultObjectFiles>;
    removeFile(bucketName: string, fileName: string): Promise<ResultObject>;
    sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;
    bucketExists(name: string): Promise<ResultObjectBoolean>;
    fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>;
    addFile(params: FilePathParams | FileBufferParams | FileStreamParams): Promise<ResultObject>;
}
