import { Options, StreamOptions, StorageType } from "./types/general";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params";
import { ResultObject, ResultObjectBoolean, ResultObjectBuckets, ResultObjectFiles, ResultObjectNumber, ResultObjectStream } from "./types/result";
import { AdapterConfigLocal } from "./types/adapter_local";
import { AbstractAdapter } from "./AbstractAdapter";
export declare class AdapterLocal extends AbstractAdapter {
    protected _type: StorageType;
    protected _config: AdapterConfigLocal;
    protected _configError: string | null;
    constructor(config: AdapterConfigLocal);
    /**
     * @param path
     * creates a directory if it doesn't exist
     */
    private createDirectory;
    private globFiles;
    addFile(params: FilePathParams | FileBufferParams | FileStreamParams): Promise<ResultObject>;
    createBucket(name: string, options?: Options): Promise<ResultObject>;
    clearBucket(name: string): Promise<ResultObject>;
    deleteBucket(name: string): Promise<ResultObject>;
    listBuckets(): Promise<ResultObjectBuckets>;
    listFiles(bucketName: string): Promise<ResultObjectFiles>;
    getFileAsStream(bucketName: string, fileName: string, options?: StreamOptions): Promise<ResultObjectStream>;
    getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject>;
    removeFile(bucketName: string, fileName: string): Promise<ResultObject>;
    sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;
    bucketExists(bucketName: string): Promise<ResultObjectBoolean>;
    fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>;
}
