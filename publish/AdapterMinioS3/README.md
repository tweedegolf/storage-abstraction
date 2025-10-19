# MinIO S3 Adapter

This adapter provides an abstraction layer over the S3 API of MinIO cloud storage. It extends `AdapterAmazonS3` and overrides some methods because the implementation of MinIO is not fully compatible.

The adapter is one of the adapters that is meant to be used as a plugin of the [Storage Abstraction package](https://www.npmjs.com/package/@tweedegolf/storage-abstraction). However it can be used standalone as well, see [below](#standalone).

The [API](https://github.com/tweedegolf/storage-abstraction/tree/master?tab=readme-ov-file#adapter-api) of the adapter abstracts away the differences between the API's of cloud storage services. The API only supports the basic, most commonly used cloud service operations such as creating a bucket, storing files and so on.

It is also possible to access all the specific functionality of the cloud service API through the service client of the adapter, see [here](https://github.com/tweedegolf/storage-abstraction/tree/master?tab=readme-ov-file#getserviceclient).

If you are new to the Storage Abstraction library you may want to read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#how-it-works) first.

MinIO also has a native API. You can use [this adapter](https://www.npmjs.com/package/@tweedegolf/sab-adapter-minio) if you want to use the native API.


```typescript
import { Storage, StorageType } from "@tweedegolf/storage-abstraction";

const configuration = {
  type: StorageType.MINIO_S3,
};

const storage = new Storage(configuration);

const result = await storage.listBuckets();

console.log(result);
```

The Storage class is cloud service agnostic and doesn't know anything about the adapter it uses and adapters are completely interchangeable. It only expects the adapter to have implemented all methods of the `IAdapter` interface, see the [API](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api).

When you create a Storage instance it checks the mandatory `type` key in the configuration object and then loads the appropriate adapter module automatically from your node_modules folder using `require()`. For more information please read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#register-your-adapter).

## Configuration

The configuration object that you pass to the Storage constructor is forwarded to the constructor of the adapter.

The Storage constructor is only interested in the `type` key of the configuration object, all other keys are necessary for configuring the adapter.

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
export interface AdapterConfigS3 extends AdapterConfig {
  region?: string; 
  endpoint: string; // mandatory
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  accessKeyId: string;
  secretAccessKey: string;
}
```

Note that region is mandatory for the AWS SDK S3Client but it will also be picked up as environment variable `AWS_REGION`; therefor it is not mandatory in the config object. 

Also note that `accessKeyId`, `secretAccessKey` and `endpoint` are mandatory!

## Examples

Example with configuration object:

Examples with configuration object:

```typescript
// MinIO S3 compatible
const s = new Storage({
  type: StorageType.MINIO_S3,
  accessKeyId: 'access-key'
  secretAccessKey: 'secret-key'
  endpoint: "https://play.min.io/",
  region: "us-east-1",
});

const s = new Storage({
  type: StorageType.MINIO_S3,
  accessKeyId: 'access-key'
  secretAccessKey: 'secret-key'
  endpoint: "https://play.min.io/",
  region: "eu-east-1",
  bucketName: "the-buck",
});
```

Example with configuration url:

```typescript
const s = new Storage(
  "s3://access-key:secret-key?endpoint=https://play.min.io/&region=us-east-1"
);

const s = new Storage(
  "s3://access-key:secret-key@the-buck?endpoint=https://play.min.io/&region=us-east-1"
);
```

It is mandatory to set a value for `region` you can also set the region using the `AWS_REGION` environment variable. So far, the only valid value is "us-east-1"

For more information about configuration urls please read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#configuration-url).

## Standalone

You can also use the adapter standalone, without the need to create a Storage instance:

```typescript
import { AdapterAmazonS3 } from "@tweedegolf/sab-adapter-amazon-s3";

const a = new AdapterAmazonS3();
const r = await a.listBuckets();
console.log(r);
```

## API

For a complete description of the Adapter API see [this part](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api) documentation of the Storage Abstraction package readme.

