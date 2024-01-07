import { AdapterConfig } from "./general";
export declare enum S3Compatible {
    Amazon = 0,
    R2 = 1,
    Backblaze = 2,
    Cubbit = 3
}
export interface AdapterConfigAmazonS3 extends AdapterConfig {
    region?: string;
    endpoint?: string;
    credentials?: {
        accessKeyId?: string;
        secretAccessKey?: string;
    };
    accessKeyId?: string;
    secretAccessKey?: string;
}
