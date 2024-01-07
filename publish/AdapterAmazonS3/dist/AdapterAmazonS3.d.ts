import { AbstractAdapter } from "./AbstractAdapter";
import { S3Client } from "@aws-sdk/client-s3";
import { AdapterConfig, StorageType, ResultObjectStream, ResultObject, ResultObjectBuckets, FileBufferParams, FilePathParams, FileStreamParams, ResultObjectFiles, ResultObjectNumber, ResultObjectBoolean, Options, AdapterConfigS3, StreamOptions } from "./types";
export declare class AdapterAmazonS3 extends AbstractAdapter {
    protected _type: StorageType;
    protected _config: AdapterConfigS3;
    protected _configError: string | null;
    protected _client: S3Client;
    constructor(config: string | AdapterConfig);
    private getFiles;
    private getFileVersions;
    get config(): AdapterConfigS3;
    get serviceClient(): S3Client;
    getFileAsStream(bucketName: string, fileName: string, options?: StreamOptions): Promise<ResultObjectStream>;
    removeFile(bucketName: string, fileName: string): Promise<ResultObject>;
    createBucket(name: string, options?: Options): Promise<ResultObject>;
    clearBucket(name: string): Promise<ResultObject>;
    deleteBucket(name: string): Promise<ResultObject>;
    listBuckets(): Promise<ResultObjectBuckets>;
    addFile(params: FilePathParams | FileBufferParams | FileStreamParams): Promise<ResultObject>;
    getFileAsURL(bucketName: string, fileName: string, options?: Options): Promise<ResultObject>;
    listFiles(bucketName: string, maxFiles?: number): Promise<ResultObjectFiles>;
    sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;
    bucketExists(bucketName: string): Promise<ResultObjectBoolean>;
    fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>;
}
