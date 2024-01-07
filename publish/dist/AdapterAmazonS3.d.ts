import { S3Client } from "@aws-sdk/client-s3";
import { AbstractAdapter } from "./AbstractAdapter";
import { Options, StreamOptions, StorageType } from "./types/general";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params";
import { ResultObject, ResultObjectBoolean, ResultObjectBuckets, ResultObjectFiles, ResultObjectNumber, ResultObjectStream } from "./types/result";
import { AdapterConfigAmazonS3 } from "./types/adapter_amazon_s3";
export declare class AdapterAmazonS3 extends AbstractAdapter {
    protected _type: StorageType;
    protected _config: AdapterConfigAmazonS3;
    protected _configError: string | null;
    protected _client: S3Client;
    constructor(config: string | AdapterConfigAmazonS3);
    private getFiles;
    private getFileVersions;
    get config(): AdapterConfigAmazonS3;
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
