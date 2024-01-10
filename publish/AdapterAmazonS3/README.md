# MinIO Adapter

This adapter is a peer dependency of the [storage abstraction package](https://www.npmjs.com/package/@tweedegolf/storage-abstraction). It provides an abstraction layer over the API of the Amazon S3 cloud storage service and S3 compatible services like Cubbit, Cloudflare R2 and Backblaze B2 S3. You can use it both stand alone and as the adapter of a `Storage` instance:

1. Stand alone

```typescript
import { AdapterAmazonS3 } from "@tweedegolf/sab-adapter-amazon-s3";

const a = new AdapterAmazonS3();
const r = await a.listBuckets();
console.log(r);
```

2. As the adapter of a `Storage` instance:

```typescript
import { Storage, StorageType } from "@tweedegolf/storage-abstraction";
import { AdapterAmazonS3 } from "@tweedegolf/sab-adapter-amazon-s3";

const s = new Storage({
  type: StorageType.S3,
});

const r = await a.listBuckets();
console.log(r);
```

## Configuration

The Adapter class takes one optional argument of type `AdapterConfig` and the Storage class takes one mandatory argument of type `StorageAdapterConfig`

```typescript
export interface AdapterConfig {
  bucketName?: string;
  [id: string]: any; // eslint-disable-line
}

export interface StorageAdapterConfig {
  type: string;
  bucketName?: string;
  [id: string]: any; // eslint-disable-line
}
```

As you can see argument the Storage class expects had an additional key `type`. This is necessary because the Storage is cloud service agnostic.

The Minio adapter requires some service specific mandatory keys:

```typescript
export interface AdapterConfigMinio extends AdapterConfig {
  endPoint: string;
  accessKey: string;
  secretKey: string;
  region?: string;
  useSSL?: boolean;
  port?: number;
  [key: string]: any; // eslint-disable-line
}
```

## API

For a complete description of the Adapter API see [this part](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api) documentation of the Storage Abstraction package readme.
