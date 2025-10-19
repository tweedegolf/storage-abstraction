import { AdapterConfig } from "./general";
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
export interface AdapterConfigS3 extends AdapterConfigAmazonS3 {
    region?: string;
    endpoint: string;
    credentials?: {
        accessKeyId?: string;
        secretAccessKey?: string;
    };
    accessKeyId: string;
    secretAccessKey: string;
}
