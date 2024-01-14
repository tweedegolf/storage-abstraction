# Amazon S3 Adapter

This adapter is a peer dependency of the [storage abstraction package](https://www.npmjs.com/package/@tweedegolf/storage-abstraction). It provides an abstraction layer over the API of the Amazon S3 cloud storage service and S3 compatible services like Cubbit, Cloudflare R2 and Backblaze B2 S3.

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
  [id: string]: any; // any mandatory or optional key
}

export interface StorageAdapterConfig extends AdapterConfig {
  type: string;
}
```

As you can see argument the Storage class expects an additional key `type`. This is necessary because the Storage class is cloud service agnostic and doesn't know anything about the adapter it uses.

The Amazon S3 adapter requires some service specific mandatory keys:

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

### Amazon S3

Adapter config:

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

Example with configuration object:

```typescript
// Cubbit S3 compatible
const s = new Storage({
  type: StorageType.S3,
  accessKeyId: 'your-key-id'
  secretAccessKey: 'your-secret'
  endpoint: "https://s3.cubbit.eu/",
  region: "auto",
});
```

Example with configuration url:

```typescript
// Cubbit S3 compatible
const s = new Storage(
  "s3://accessKeyId=your-key-id&secretAccessKey=your-access-key&endpoint=https://s3.cubbit.eu/&region=auto"
);
```

If you use Amazon S3 it is possible to skip the passing in of the `accessKeyId`, `secretAccessKey` and `region`; the aws sdk will automatically read it from a chain of providers, e.g. from environment variables or the ECS task role, so this will work:

```typescript
// only for Amazon S3
const s = new Storage({ type: StorageType.S3 });
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

Note that this does _not_ work for S3 compatible services because the aws sdk doesn't read the endpoint from environment variables.

Also, if you pass a value for `endpoint` in the config, for some reason aws sdk does read the environment variable `AWS_REGION` `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

So for S3 compatible services setting a value for `endpoint`, `accessKeyId` and `secretAccessKey` in the config is mandatory.

For S3 compatible services `region` is mandatory as well but you don't have to pass this in the config because aws sdk always reads the `AWS_REGION` environment variable if no value is provided in the config. Note that the names of the regions may differ from service to service, see below.

#### <a name='s3-compatible-storage'></a>S3 Compatible Storage

Cloudflare R2, Backblaze B2 and Cubbit are S3 compatible services. You can use the `AdapterAmazonS3` but you have to add a value for `endpoint` in the config.

#### Cloudflare R2

```typescript
const s = new Storage({
  type: StorageType.S3,
  region: 'auto'
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY,
  secretAccessKey: process.env.R2_SECRET_KEY,
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
  type: StorageType.S3,
  region: "eu-central-003",
  endpoint: process.env.B2_ENDPOINT,
  accessKeyId: process.env.B2_APPLICATION_KEY_ID,
  secretAccessKey: process.env.B2_APPLICATION_KEY,
});
```

The endpoint is `https://s3.<REGION>.backblazeb2.com`. Although the region is part of the endpoint aws sdk still expects you to set a value for `region` in the configuration. As just stated, you can simply retrieve your region from the endpoint.

Backblaze also has a native API, see below.

## API

For a complete description of the Adapter API see [this part](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api) documentation of the Storage Abstraction package readme.

## Standalone

You can also use the adapter standalone, without the need to create a Storage instance:

```typescript
import { AdapterAmazonS3 } from "@tweedegolf/sab-adapter-amazon-s3";

const a = new AdapterAmazonS3();
const r = await a.listBuckets();
console.log(r);
```
