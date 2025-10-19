import { AdapterConfig } from "./general";
export interface AdapterConfigMinio extends AdapterConfig {
    endPoint: string;
    accessKey: string;
    secretKey: string;
    region?: string;
    useSSL?: boolean;
    port?: number;
}
