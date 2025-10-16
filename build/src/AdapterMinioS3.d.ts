import { S3Client } from "@aws-sdk/client-s3";
import { Options, Provider } from "./types/general";
import { ResultObject, ResultObjectObject } from "./types/result";
import { AdapterConfigAmazonS3 } from "./types/adapter_amazon_s3";
import { AdapterAmazonS3 } from "./AdapterAmazonS3";
export declare class AdapterMinioS3 extends AdapterAmazonS3 {
    protected _config: AdapterConfigAmazonS3;
    protected _client: S3Client;
    protected _provider: Provider;
    protected _configError: null | string;
    constructor(config: string | AdapterConfigAmazonS3);
    protected makeBucketPublic(bucketName: string, _options?: Options): Promise<ResultObject>;
    protected _getPublicURL(bucketName: string, fileName: string, _options: Options): Promise<ResultObject>;
    protected _getPresignedUploadURL(bucketName: string, fileName: string, options: Options): Promise<ResultObjectObject>;
}
