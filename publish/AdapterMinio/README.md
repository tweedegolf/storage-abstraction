# MinIO Storage Adapter

This adapter is a peer dependency of the [storage abstraction package](https://www.npmjs.com/package/@tweedegolf/storage-abstraction). It provides an abstraction layer over the API of the MinIO cloud storage service.

If you are new to the Storage Abstraction library you may want to read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#how-it-works) first.

```typescript
import { Storage, StorageType } from "@tweedegolf/storage-abstraction";

const configuration = {
  type: StorageType.MINIO,
  port: 9000,
  useSSL: true,
  region: "us-east-1",
  endPoint: "play.min.io",
  accessKey: "Q3AM3UQ867SPQQA43P2F",
  secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG",
};

const storage = new Storage(configuration);

const result = await a.listBuckets();

console.log(result);
```

The Storage class is cloud service agnostic and doesn't know anything about the adapter it uses. It only expects the adapter to have implemented all methods of the `IAdapter` interface, see the [API](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api).

When you create a Storage instance it checks the mandatory `type` key in the configuration object and then loads the appropriate adapter module automatically from your node_modules folder using `require`. For more information please read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#register-your-adapter).

## Configuration

The configuration object that you pass to the Storage constructor is forwarded to the constructor of the adapter.

The Storage constructor is only interested in the `type` key of the configuration object, all other keys are necessary for configuring the adapter.

The Storage constructor expects the configuration to be of type `StorageAdapterConfig`.

The adapter expects the configuration to be of type `AdapterConfig` or a type that extends this `AdapterConfig`.

```typescript
export interface AdapterConfig {
  bucketName?: string;
  [id: string]: any; // any mandatory or optional key
}

export interface StorageAdapterConfig extends AdapterConfig {
  type: string;
}
```

The type of the configuration object for this adapter:

```typescript
export interface AdapterConfigMinio extends AdapterConfig {
  endPoint: string;
  accessKey: string;
  secretKey: string;
  region?: string;
  useSSL?: boolean;
  port?: number;
}
```

## Examples

Example with configuration object:

```typescript
const s = new Storage({
  type: StorageType.MINIO,
  endPoint: "play.min.io",
  accessKey: "Q3AM3UQ867SPQQA43P2F",
  secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG",
});
```

Example with configuration url:

```typescript
const s = new Storage(
  "minio://endPoint=play.min.io&accessKey=Q3AM3UQ867SPQQA43P2F&secretKey=zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG"
);
```

For more information about configuration urls read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#configuration-url).

## API

For a complete description of the Adapter API see [this part](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api) documentation of the Storage Abstraction package readme.

## Standalone

You can also use the adapter standalone, without the need to create a Storage instance:

```typescript
import { AdapterMinio } from "@tweedegolf/sab-adapter-minio";

const adapter = new AdapterMinio({
  endPoint: "play.min.io",
  accessKey: "Q3AM3UQ867SPQQA43P2F",
  secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG",
});

const result = await adapter.listBuckets();
console.log(result);
```
