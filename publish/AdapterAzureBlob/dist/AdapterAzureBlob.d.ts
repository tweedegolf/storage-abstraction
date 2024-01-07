import { BlobServiceClient } from "@azure/storage-blob";
import { AbstractAdapter } from "./AbstractAdapter";
import { Options, StreamOptions, StorageType } from "./types/general";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params";
import { ResultObject, ResultObjectBoolean, ResultObjectBuckets, ResultObjectFiles, ResultObjectNumber, ResultObjectStream } from "./types/result";
import { AdapterConfigAzureBlob } from "./types/adapter_azure_blob";
export declare class AdapterAzureBlob extends AbstractAdapter {
    protected _type: StorageType;
    protected _config: AdapterConfigAzureBlob;
    protected _configError: string | null;
    protected _client: BlobServiceClient;
    private sharedKeyCredential;
    constructor(config: string | AdapterConfigAzureBlob);
    get config(): AdapterConfigAzureBlob;
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
