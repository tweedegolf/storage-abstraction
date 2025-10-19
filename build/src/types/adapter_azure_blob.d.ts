import { AdapterConfig } from "./general";
export interface AdapterConfigAzureBlob extends AdapterConfig {
    accountName?: string;
    connectionString?: string;
    accountKey?: string;
    sasToken?: string;
    blobDomain?: string;
}
