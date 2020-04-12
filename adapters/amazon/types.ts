import { IAdapterConfig } from "@tweedegolf/storage-abstraction";

export interface ConfigAmazonS3 extends IAdapterConfig {
  accessKeyId: string;
  secretAccessKey: string;
}
