import * as Minio from "minio";
import { AbstractAdapter } from "./AbstractAdapter";
import { Options, StreamOptions, StorageType } from "./types/general";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params";
import { ResultObject, ResultObjectBoolean, ResultObjectBuckets, ResultObjectFiles, ResultObjectNumber, ResultObjectStream } from "./types/result";
import { AdapterConfigMinio } from "./types/adapter_minio";
export declare class AdapterMinio extends AbstractAdapter {
    protected _type: StorageType;
    protected _client: Minio.Client;
    protected _configError: string | null;
    protected _config: AdapterConfigMinio;
    constructor(config: string | AdapterConfigMinio);
    get config(): AdapterConfigMinio;
    getConfig(): AdapterConfigMinio;
    get serviceClient(): Minio.Client;
    getServiceClient(): Minio.Client;
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
