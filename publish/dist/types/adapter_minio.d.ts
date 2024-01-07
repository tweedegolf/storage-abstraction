export interface AdapterConfigMinio {
    endPoint: string;
    accessKey: string;
    secretKey: string;
    region?: string;
    useSSL?: boolean;
    port?: number;
    [key: string]: any;
}
