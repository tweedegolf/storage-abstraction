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

### Azure Blob Storage

> peer dependencies: <br/> > `npm i @azure/storage-blob`

Adapter config

```typescript
export interface AdapterConfigAzure extends AdapterConfig {
  accountName?: string;
  connectionString?: string;
  accountKey?: string;
  sasToken?: string;
}
```

Example with configuration object:

```typescript
const s = new Storage({
  type: StorageType.AZURE,
  accountName: "yourAccount",
  accountKey: "yourKey",
});
```

Example with configuration url:

```typescript
const s = new Storage("azure://accountName=yourAccount");
```

There are multiple ways to login to Azure Blob Storage. Microsoft recommends to use passwordless authorization, for this you need to provide a value for `accountName` which is the name of your storage account. Then you can either login using the Azure CLI command `az login` or by setting the following environment variables:

```shell
AZURE_TENANT_ID
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET

```

You can find these values in the Azure Portal

Alternately you can login by:

- providing a value for `connectionString`
- providing a value for both `accountName` and `accountKey`
- providing a value for both `accountName` and `sasToken`

Note that if you don't use the `accountKey` for authorization and you add files to a bucket you will get this error message:

`'Can only generate the SAS when the client is initialized with a shared key credential'`

This does not mean that the file hasn't been uploaded, it simply means that no public url can been generated for this file.

## API

For a complete description of the Adapter API see [this part](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api) documentation of the Storage Abstraction package readme.
