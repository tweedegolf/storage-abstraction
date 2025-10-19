# Amazon S3 Storage Adapter

An adapter that provides an abstraction layer over the API of the Amazon S3 cloud storage service and other *fully* S3 compatible services.

This adapter is one of the adapters that is meant to be used as a plugin of the [Storage Abstraction package](https://www.npmjs.com/package/@tweedegolf/storage-abstraction). However it can be used standalone as well, see [below](#standalone).

The [API](https://github.com/tweedegolf/storage-abstraction/tree/master?tab=readme-ov-file#adapter-api) of the adapter abstracts away the differences between the API's of cloud storage providers. The API only supports the basic, most commonly used cloud service operations such as creating a bucket, storing files and so on.

It is also possible to access all the specific functionality of the cloud service API through the service client of the adapter, see [here](https://github.com/tweedegolf/storage-abstraction/tree/master?tab=readme-ov-file#getserviceclient).

If you are new to the Storage Abstraction library you may want to read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#how-it-works) first.

```typescript
import { Storage, Provider } from "@tweedegolf/storage-abstraction";

const configuration = {
  type: Provider.AWS,
};

const storage = new Storage(configuration);

const result = await storage.listBuckets();

console.log(result);
```

The Storage class is cloud service agnostic and doesn't know anything about the adapter it uses and adapters are completely interchangeable. It only expects the adapter to have implemented all methods of the `IAdapter` interface, see the [API](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api).

When you create a Storage instance it checks the mandatory `provider` key in the configuration object and then loads the appropriate adapter module automatically from your node_modules folder using `require()`. For more information please read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#register-your-adapter).

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
export interface AdapterConfigAmazonS3 extends AdapterConfig {
  region?: string;
  endpoint?: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  accessKeyId?: string;
  secretAccessKey?: string;
}
```

## Examples

Examples with configuration object:

```typescript
const s = new Storage({
  type: Provider.AWS,
  accessKeyId: 'your-key-id'
  secretAccessKey: 'your-secret'
});

const s = new Storage({
  type: Provider.AWS,
  accessKeyId: 'your-key-id'
  secretAccessKey: 'your-secret'
  region: "eu-west-1",
  bucketName: "the-buck",
});
```

Same example with configuration url:

```typescript
const s = new Storage(
  "aws://your-key-id:your-access-key?region=eu-west-1"
);

const s = new Storage(
  "aws://your-key-id:your-access-key@the-buck?region=eu-west-1"
);
```

For more information about configuration urls please read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#configuration-url).

### Amazon S3

If you use this adapter to interact with the original Amazon S3 service it is possible to skip the passing in of the `accessKeyId`, `secretAccessKey` and `region`; the AWS SDK will automatically read it from a chain of providers, e.g. from environment variables or the ECS task role, so this will work:

```typescript
const s = new Storage({ type: Provider.AWS });
// with a config url:
const s = new Storage("aws://");
// and even:
const s = new Storage("aws");
```

The environment variables that you need to set for this are:

```shell
AWS_ACCESS_KEY_ID="your access key"
AWS_SECRET_ACCESS_KEY="your secret"
AWS_REGION="eu-west-1"

```

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
