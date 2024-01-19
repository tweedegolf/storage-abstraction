# Azure Blob Storage Adapter

An adapter that provides an abstraction layer over the API of the Microsoft Azure Blob cloud storage service.

This adapter is one of the adapters that is meant to be used as a plugin of the [Storage Abstraction package](https://www.npmjs.com/package/@tweedegolf/storage-abstraction). However it can be used standalone as well, see [below](#standalone).

The [API](https://github.com/tweedegolf/storage-abstraction/tree/master?tab=readme-ov-file#adapter-api) of the adapter abstracts away the differences between the API's of cloud storage services. The API only supports the basic, most commonly used cloud service operations such as creating a bucket, storing files and so on.

It is also possible to access all the specific functionality of the cloud service API through the service client of the adapter, see [here](https://github.com/tweedegolf/storage-abstraction/tree/master?tab=readme-ov-file#getserviceclient).

If you are new to the Storage Abstraction library you may want to read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#how-it-works) first.

```typescript
import { Storage, StorageType } from "@tweedegolf/storage-abstraction";

const configuration = {
  type: StorageType.AZURE,
  accountName: "yourAccount",
  accountKey: "yourKey",
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
export interface AdapterConfigAzure extends AdapterConfig {
  accountName?: string;
  connectionString?: string;
  accountKey?: string;
  sasToken?: string;
}
```

## Examples

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

For more information about configuration urls please read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#configuration-url).

## Microsoft Azure Blob Storage

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

## Standalone

You can also use the adapter standalone, without the need to create a Storage instance:

```typescript
import { AdapterAzureBlob } from "@tweedegolf/sab-adapter-azure-blob";

const a = new AdapterAzureBlob({
  accountName: "yourAccount",
});
const r = await a.listBuckets();
console.log(r);
```

## API

For a complete description of the Adapter API see [this part](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api) documentation of the Storage Abstraction package readme.
