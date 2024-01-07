import { StorageType, AdapterConfigLocal, ResultObjectBoolean, FileBufferParams, FilePathParams, FileStreamParams, ResultObject, ResultObjectBuckets, ResultObjectFiles, ResultObjectStream, ResultObjectNumber, Options, StreamOptions } from "./types";
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
