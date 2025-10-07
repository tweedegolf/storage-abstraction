# MinIO Storage Adapter

An adapter that provides an abstraction layer over the API of the MinIO cloud storage service.

This adapter is one of the adapters that is meant to be used as a plugin of the [Storage Abstraction package](https://www.npmjs.com/package/@tweedegolf/storage-abstraction). However it can be used standalone as well, see [below](#standalone).

The [API](https://github.com/tweedegolf/storage-abstraction/tree/master?tab=readme-ov-file#adapter-api) of the adapter abstracts away the differences between the API's of cloud storage services. The API only supports the basic, most commonly used cloud service operations such as creating a bucket, storing files and so on.

It is also possible to access all the specific functionality of the cloud service API through the service client of the adapter, see [here](https://github.com/tweedegolf/storage-abstraction/tree/master?tab=readme-ov-file#getserviceclient).

If you are new to the Storage Abstraction library you may want to read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#how-it-works) first.

```typescript
import { Storage, Provider } from "@tweedegolf/storage-abstraction";

const configuration = {
  type: Provider.MINIO,
  port: 9000,
  useSSL: true,
  region: "us-east-1",
  endPoint: "play.min.io",
  accessKey: "Q3AM3UQ867SPQQA43P2F",
  secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG",
};

const storage = new Storage(configuration);

const result = await storage.listBuckets();

console.log(result);
```

The Storage class is cloud service agnostic and doesn't know anything about the adapter it uses and adapters are completely interchangeable. It only expects the adapter to have implemented all methods of the `IAdapter` interface, see the [API](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api).

When you create a Storage instance it checks the mandatory `provider` key in the configuration object and then loads the appropriate adapter module automatically from your node_modules folder using `require`. For more information please read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#register-your-adapter).

## Configuration

The configuration object that you pass to the Storage constructor is forwarded to the constructor of the adapter.

The Storage constructor is only interested in the `provider` key of the configuration object, all other keys are necessary for configuring the adapter.

The Storage constructor expects the configuration to be of type `StorageAdapterConfig`.

The adapter expects the configuration to be of type `AdapterConfig` or a type that extends this type.

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

Examples with configuration object:

```typescript
const s = new Storage({
  type: Provider.MINIO,
  endPoint: "play.min.io",
  accessKey: "your-access-key",
  secretKey: "your-secret-key",
});

const s = new Storage({
  type: Provider.MINIO,
  endPoint: "play.min.io",
  accessKey: "your-access-key",
  secretKey: "your-secret-key",
  bucketName: "the-buck",
  port: 9000,
});

const s = new Storage({
  type: Provider.MINIO,
  endPoint: "play.min.io",
  accessKey: "your-access-key",
  secretKey: "your-secret-key",
  port: 9000,
});
```

Same examples with configuration url:

```typescript
const s = new Storage(
  "minio://your-access-key:your-secret-key?endPoint=play.min.io"


const s = new Storage(
  "minio://your-access-key:your-secret-key@the-buck:9000?endPoint=play.min.io"

const s = new Storage(
  "minio://your-access-key:your-secret-key:9000?endPoint=play.min.io"
);
```

You can pass the port using a colon but you can also pass it as a query param, the following urls are equal because the `searchParams` object will be flattened into the config object:

```typescript
const s = new Storage("minio://your-access-key:your-secret-key@the-buck:9000");
const p = {
  protocol: "minio",
  username: "your-access-key",
  password: "your-secret-key",
  host: "the-buck",
  port: "9000",
  path: null,
  searchParams: null,
};

// same as:
const s = new Storage("minio://your-access-key:your-secret-key@the-buck?port=9000");
const p = {
  protocol: "minio",
  username: "your-access-key",
  password: "your-secret-key",
  host: "the-buck",
  port: null,
  path: null,
  searchParams: { port: "9000" },
};

// both are converted to:
const c: AdapterConfigMinio = {
  type: "minio",
  accessKey: "your-access-key";
  secretKey: "your-secret-keu";
  bucketName: "the-buck",
  port: 9000;
}
```

For more information about configuration urls please read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#configuration-url).

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

## API

For a complete description of the Adapter API see [this part](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api) documentation of the Storage Abstraction package readme.
