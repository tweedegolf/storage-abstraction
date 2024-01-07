import * as Minio from "minio";
import { AbstractAdapter } from "./AbstractAdapter";
import { AdapterConfigMinIO, FileBufferParams, FilePathParams, FileStreamParams, Options, ResultObject, ResultObjectBoolean, ResultObjectBuckets, ResultObjectFiles, ResultObjectNumber, ResultObjectStream, StorageType, StreamOptions } from "./types";
export declare class AdapterMinio extends AbstractAdapter {
    protected _type: StorageType;
    protected _client: Minio.Client;
    protected _configError: string | null;
    protected _config: AdapterConfigMinIO;
    constructor(config: string | AdapterConfigMinIO);
    get config(): AdapterConfigMinIO;
    get serviceClient(): Minio.Client;
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
