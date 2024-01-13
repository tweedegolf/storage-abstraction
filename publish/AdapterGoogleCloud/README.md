# MinIO Adapter

This adapter is a peer dependency of the [storage abstraction package](https://www.npmjs.com/package/@tweedegolf/storage-abstraction). It provides an abstraction layer over the API of the MinIO cloud storage service. You can use it both stand alone and as the adapter of a `Storage` instance:

1. Stand alone

```typescript
import { AdapterMinio } from "@tweedegolf/sab-adapter-minio";

const a = new AdapterMinio({
  port: 9000,
  useSSL: true,
  region: "us-east-1",
  endPoint: "play.min.io",
  accessKey: "Q3AM3UQ867SPQQA43P2F",
  secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG",
});

const r = await a.listBuckets();
console.log(r);
```

2. As the adapter of a `Storage` instance:

```typescript
import { Storage, StorageType } from "@tweedegolf/storage-abstraction";
import { AdapterMinio } from "@tweedegolf/sab-adapter-minio";

const s = new Storage({
  type: StorageType.MINIO,
  port: 9000,
  useSSL: true,
  region: "us-east-1",
  endPoint: "play.min.io",
  accessKey: "Q3AM3UQ867SPQQA43P2F",
  secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG",
});

const r = await a.listBuckets();
console.log(r);
```

## Configuration

The Adapter class takes one argument of type `AdapterConfig` and the Storage class takes one argument of type `StorageAdapterConfig`

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

As you can see argument the Storage class expects had an additional key `type`. This is necessary because the Storage class is cloud service agnostic and doesn't know anything about the adapter it uses.

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

### Google Cloud

> peer dependencies: <br/> > `npm i @google-cloud/storage`

Adapter config:

```typescript
export interface AdapterConfigGoogle extends AdapterConfig {
  keyFilename?: string;
}
```

Example with configuration object:

```typescript
const s = new Storage({
  type: StorageType.GCS,
  keyFilename: "path/to/keyFile.json",
});
```

Example with configuration url:

```typescript
const s = new Storage("gcs://keyFilename=path/to/keyFile.json");
```

Google cloud service can read default credentials from an environment variable.

```typescript
const s = new Storage({ type: StorageType.GCS });
// using a config url:
const s = new Storage("gcs://");
// and even:
const s = new Storage("gcs");
```

Environment variable that is automatically read:

```shell
GOOGLE_APPLICATION_CREDENTIALS="path/to/keyFile.json"
```

## API

For a complete description of the Adapter API see [this part](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api) documentation of the Storage Abstraction package readme.
