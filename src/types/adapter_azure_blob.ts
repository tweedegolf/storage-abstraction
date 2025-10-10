import { AdapterConfig } from "./general.ts";

export interface AdapterConfigAzureBlob extends AdapterConfig {
  accountName?: string;
  connectionString?: string;
  accountKey?: string;
  sasToken?: string;
  blobDomain?: string;
}
