import { IAdapter, AdapterConfig, Options, StreamOptions, StorageAdapterConfig, Provider } from "./types/general";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params";
import { ResultObject, ResultObjectBoolean, ResultObjectBuckets, ResultObjectFiles, ResultObjectNumber, ResultObjectObject, ResultObjectStream } from "./types/result";
/**
 * @implements {IAdapter}
 */
export declare class Storage implements IAdapter {
    private _adapter;
    constructor(config: string | StorageAdapterConfig);
    switchAdapter(config: string | StorageAdapterConfig): void;
    setSelectedBucket(bucketName: string | null): void;
    set selectedBucket(bucketName: string | null);
    getSelectedBucket(): string | null;
    get selectedBucket(): string | null;
    set bucketName(bucketName: string | null);
    get bucketName(): string | null;
    get adapter(): IAdapter;
    getAdapter(): IAdapter;
    get provider(): Provider;
    getProvider(): Provider;
    get config(): AdapterConfig;
    getConfig(): AdapterConfig;
    get configError(): string | null;
    getConfigError(): string | null;
    get serviceClient(): any;
    getServiceClient(): any;
    addFile(paramObject: FilePathParams | FileBufferParams | FileStreamParams): Promise<ResultObject>;
    addFileFromPath(params: FilePathParams): Promise<ResultObject>;
    addFileFromBuffer(params: FileBufferParams): Promise<ResultObject>;
    addFileFromStream(params: FileStreamParams): Promise<ResultObject>;
    createBucket(...args: [bucketName?: string, options?: Options] | [options?: Options]): Promise<ResultObject>;
    clearBucket(bucketName?: string): Promise<ResultObject>;
    deleteBucket(bucketName?: string): Promise<ResultObject>;
    listBuckets(): Promise<ResultObjectBuckets>;
    getFileAsStream(...args: [bucketName: string, fileName: string, options?: StreamOptions] | [fileName: string, options?: StreamOptions]): Promise<ResultObjectStream>;
    getPublicURL(...args: [bucketName: string, fileName: string, options?: Options] | [fileName: string, options?: Options]): Promise<ResultObject>;
    getSignedURL(...args: [bucketName: string, fileName: string, options?: Options] | [fileName: string, options?: Options]): Promise<ResultObject>;
    removeFile(...args: [bucketName: string, fileName: string] | [fileName: string]): Promise<ResultObject>;
    listFiles(...args: [bucketName: string, numFiles?: number] | [numFiles?: number] | [bucketName?: string]): Promise<ResultObjectFiles>;
    sizeOf(...args: [bucketName: string, fileName: string] | [fileName: string]): Promise<ResultObjectNumber>;
    bucketExists(bucketName?: string): Promise<ResultObjectBoolean>;
    bucketIsPublic(bucketName?: string): Promise<ResultObjectBoolean>;
    fileExists(...args: [bucketName: string, fileName: string] | [fileName: string]): Promise<ResultObjectBoolean>;
    getPresignedUploadURL(...args: [bucketName: string, fileName: string, options?: Options] | [fileName: string, options?: Options]): Promise<ResultObjectObject>;
}
