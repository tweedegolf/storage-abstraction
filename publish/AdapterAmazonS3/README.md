# Amazon S3 Storage Adapter

An adapter that provides an abstraction layer over the API of the Amazon S3 cloud storage service and S3 compatible services like Cubbit, Cloudflare R2 and Backblaze B2 S3.

This adapter is one of the adapters that is meant to be used as a plugin of the [Storage Abstraction package](https://www.npmjs.com/package/@tweedegolf/storage-abstraction). However it can be used standalone as well, see [below](#standalone).

The [API](https://github.com/tweedegolf/storage-abstraction/tree/master?tab=readme-ov-file#adapter-api) of the adapter abstracts away the differences between the API's of cloud storage services. The API only supports the basic, most commonly used cloud service operations such as creating a bucket, storing files and so on.

It is also possible to access all the specific functionality of the cloud service API through the service client of the adapter, see [here](https://github.com/tweedegolf/storage-abstraction/tree/master?tab=readme-ov-file#getserviceclient).

If you are new to the Storage Abstraction library you may want to read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#how-it-works) first.

```typescript
import { Storage, Provider } from "@tweedegolf/storage-abstraction";

const configuration = {
  type: Provider.S3,
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
export interface AdapterConfigS3 extends AdapterConfig {
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
// Cubbit S3 compatible
const s = new Storage({
  type: Provider.S3,
  accessKeyId: 'your-key-id'
  secretAccessKey: 'your-secret'
  endpoint: "https://s3.cubbit.eu/",
  region: "auto",
});

const s = new Storage({
  type: Provider.S3,
  accessKeyId: 'your-key-id'
  secretAccessKey: 'your-secret'
  endpoint: "https://s3.cubbit.eu/",
  region: "auto",
  bucketName: "the-buck",
});
```

Same example with configuration url:

```typescript
// Cubbit S3 compatible
const s = new Storage(
  "s3://your-key-id:your-access-key?endpoint=https://s3.cubbit.eu/&region=auto"
);

const s = new Storage(
  "s3://your-key-id:your-access-key@the-buck?endpoint=https://s3.cubbit.eu/&region=auto"
);
```

For more information about configuration urls please read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#configuration-url).

### Amazon S3

If you use this adapter to interact with the original Amazon S3 service it is possible to skip the passing in of the `accessKeyId`, `secretAccessKey` and `region`; the AWS SDK will automatically read it from a chain of providers, e.g. from environment variables or the ECS task role, so this will work:

```typescript
// only for Amazon S3
const s = new Storage({ type: Provider.S3 });
// with a config url:
const s = new Storage("s3://");
// and even:
const s = new Storage("s3");
```

The environment variables that you need to set for this are:

```shell
AWS_ACCESS_KEY_ID="your access key"
AWS_SECRET_ACCESS_KEY="your secret"
AWS_REGION="eu-west-1"

```

Note that this does _not_ work for S3 compatible services because the AWS SDK doesn't read the endpoint from environment variables.

Also, if you pass a value for `endpoint` in the config, for some reason AWS SDK does not read the environment variables `AWS_REGION` `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` anymore.

So for S3 compatible services setting a value for `endpoint`, `accessKeyId` and `secretAccessKey` in the config is mandatory.

For S3 compatible services `region` is mandatory as well but you don't have to pass this in the config because AWS SDK always reads the `AWS_REGION` environment variable if no value is provided in the config. Note that the names of the regions may differ from service to service, see below.

### S3 Compatible Storage

Cloudflare R2, Backblaze B2 and Cubbit are S3 compatible services. You can use the `AdapterAmazonS3` but you have to add a value for `endpoint` in the config.

#### Cloudflare R2

```typescript
const s = new Storage({
  type: Provider.S3,
  region: 'auto'
  endpoint: R2_ENDPOINT,
  accessKeyId: R2_ACCESS_KEY,
  secretAccessKey: R2_SECRET_KEY,
});
```

The endpoint is `https://<ACCOUNT_ID>.<JURISDICTION>.r2.cloudflarestorage.com`.

Jurisdiction is optional, e.g. `eu`.

It is mandatory to set a value for `region`, use one of these values:

- `auto`
- `wnam`
- `enam`
- `weur`
- `eeur`
- `apac`

You can also set the region using the `AWS_REGION` environment variable.

#### Backblaze S3

```typescript
const s = new Storage({
  type: Provider.S3,
  region: "eu-central-003",
  endpoint: B2_ENDPOINT,
  accessKeyId: B2_APPLICATION_KEY_ID,
  secretAccessKey: B2_APPLICATION_KEY,
});
```

The endpoint is `https://s3.<REGION>.backblazeb2.com`. Although the region is part of the endpoint AWS SDK still expects you to set a value for `region` in the configuration or in the `AWS_REGION` environment variable. You can simply retrieve your region from the endpoint.

Backblaze also has a native API. You can use [this adapter](https://www.npmjs.com/package/@tweedegolf/sab-adapter-backblaze-b2) if you want to use the native API.

## Standalone

You can also use the adapter standalone, without the need to create a Storage instance:

```typescript
import { AdapterAmazonS3 } from "@tweedegolf/sab-adapter-amazon-s3";

const a = new AdapterAmazonS3();
const r = await a.listBuckets();
console.log(r);
```

## S3 Compatible Cloud Services

Not all S3 compatible cloud services support all Amazon S3 features. Therefor some API methods of the Amazon S3 adapter have limitations when used to access S3 compatible services:

| API method | Service  | Remarks |
| ---| ---| ---|
|  `createBucket` | Cloudflare R2| Use web console to make bucket public|
|   | Backblaze S3|Use web console to make bucket public|
|  `bucketIsPublic` | Cloudflare R2|N/A|
|   | Cubbit|N/A|
|  `getPublicURL` | Cloudflare R2|N/A|
|   | Cubbit|Only with options `{noCheck: true}`|

## API

For a complete description of the Adapter API see [this part](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api) documentation of the Storage Abstraction package readme.
