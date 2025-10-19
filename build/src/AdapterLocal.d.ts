import { Options, StreamOptions, Provider } from "./types/general";
import { FileBufferParams, FileStreamParams } from "./types/add_file_params";
import { ResultObject, ResultObjectBoolean, ResultObjectBuckets, ResultObjectFiles, ResultObjectNumber, ResultObjectObject, ResultObjectStream } from "./types/result";
import { AdapterConfigLocal } from "./types/adapter_local";
import { AbstractAdapter } from "./AbstractAdapter";
export declare class AdapterLocal extends AbstractAdapter {
    protected _provider: Provider;
    protected _config: AdapterConfigLocal;
    protected _configError: string | null;
    constructor(config: AdapterConfigLocal);
    /**
     * @param path
     * creates a directory if it doesn't exist
     */
    private createDirectory;
    private globFiles;
    protected _listBuckets(): Promise<ResultObjectBuckets>;
    protected _createBucket(name: string, _options: Options): Promise<ResultObject>;
    protected _addFile(params: FileBufferParams | FileStreamParams): Promise<ResultObject>;
    protected _clearBucket(name: string): Promise<ResultObject>;
    protected _deleteBucket(name: string): Promise<ResultObject>;
    protected _listFiles(bucketName: string): Promise<ResultObjectFiles>;
    protected _getFileAsStream(bucketName: string, fileName: string, options: StreamOptions): Promise<ResultObjectStream>;
    protected _getPublicURL(bucketName: string, fileName: string, options: Options): Promise<ResultObject>;
    protected _getSignedURL(bucketName: string, fileName: string, options: Options): Promise<ResultObject>;
    protected _removeFile(bucketName: string, fileName: string): Promise<ResultObject>;
    protected _sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;
    protected _bucketExists(bucketName: string): Promise<ResultObjectBoolean>;
    protected _bucketIsPublic(bucketName: string): Promise<ResultObjectBoolean>;
    protected _fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>;
    protected _getPresignedUploadURL(bucketName: string, fileName: string, options: Options): Promise<ResultObjectObject>;
    get config(): AdapterConfigLocal;
    getConfig(): AdapterConfigLocal;
}
