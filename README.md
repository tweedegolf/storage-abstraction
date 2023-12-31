# <a name='storage-abstraction'></a>Storage Abstraction

[![ci](https://github.com/tweedegolf/storage-abstraction/actions/workflows/ci.yaml/badge.svg)](https://github.com/tweedegolf/storage-abstraction/actions/workflows/ci.yaml)

Provides an abstraction layer for interacting with a storage; this storage can be a local file system or a cloud storage. Supported cloud storage services are:

- MinIO
- Azure Blob
- Backblaze B2
- Google Cloud
- Amazon S3

Also S3 compliant cloud services are supported. Tested S3 compatible services are:

- Backblaze S3
- CloudFlare
- Cubbit

Because the API only provides basic storage operations (see [below](#api-methods)) the API is cloud agnostic. This means for instance that you can develop your application using storage on local disk and then use Google Cloud or Amazon S3 in your production environment without changing any code.

## Table of contents

<!-- toc -->

- [Instantiate a storage](#instantiate-a-storage)
  - [Configuration object](#configuration-object)
  - [Configuration URL](#configuration-url)
- [Adapters](#adapters)
  - [Local storage](#local-storage)
  - [Google Cloud](#google-cloud)
  - [Amazon S3](#amazon-s3)
    - [S3 Compatible Storage](#s3-compatible-storage)
    - [Cloudflare R2](#cloudflare-r2)
    - [Backblaze S3](#backblaze-s3)
  - [Backblaze B2](#backblaze-b2)
  - [Azure Blob Storage](#azure-blob-storage)
- [API methods](#api-methods)
  - [createBucket](#createbucket)
  - [clearBucket](#clearbucket)
  - [deleteBucket](#deletebucket)
  - [listBuckets](#listbuckets)
  - [addFile](#addfile)
  - [addFileFromPath](#addfilefrompath)
  - [addFileFromBuffer](#addfilefrombuffer)
  - [addFileFromStream](#addfilefromstream)
  - [getFileAsURL](#getfileasurl)
  - [getFileAsStream](#getfileasstream)
  - [removeFile](#removefile)
  - [sizeOf](#sizeof)
  - [bucketExists](#bucketexists)
  - [fileExists](#fileexists)
  - [listFiles](#listfiles)
  - [getType](#gettype)
  - [getConfiguration](#getconfiguration)
  - [getConfigurationError](#getconfigurationerror)
  - [getServiceClient](#getserviceclient)
  - [switchAdapter](#switchadapter)
- [How it works](#how-it-works)
- [Adding more adapters](#adding-more-adapters)
  - [Define your configuration](#define-your-configuration)
  - [Adapter class](#adapter-class)
  - [Adapter function](#adapter-function)
  - [Register your adapter](#register-your-adapter)
- [Tests](#tests)
- [Example application](#example-application)
- [Questions and requests](#questions-and-requests)

<!-- tocstop -->

## Instantiate a storage

```javascript
const s = new Storage(config);
```

When instantiating a new `Storage` the argument `config` is used to create an adapter that translates the generic API calls to storage specific calls. You can provide the `config` argument in 2 forms:

1. using a configuration object (js: `typeof === "object"` ts: `AdapterConfig`)
2. using a configuration URL (`typeof === "string"`)

Internally the configuration URL will be converted to a configuration object so any rule that applies to a configuration object also applies to configuration URLs.

The configuration must at least specify a type; the type is used to create the appropriate adapter. The value of the type is one of the enum members of `StorageType`:

```typescript
enum StorageType {
  LOCAL = "local",
  GCS = "gcs",
  S3 = "s3",
  B2 = "b2",
  AZURE = "azure",
  MINIO = "minio",
}
```

### Configuration object

A configuration object type that extends `AdapterConfig`:

```typescript
interface AdapterConfig {
  type: string;
  bucketName?: string;
  [id: string]: any; // other service specific mandatory or optional keys
}
```

Besides the mandatory key `type` one or more keys may be mandatory or optional dependent on the type of storage; for instance keys for passing credentials such as `keyFilename` for Google Storage or `accessKeyId` and `secretAccessKey` for Amazon S3, and keys for further configuring the storage service such as `StoragePipelineOptions` for Azure Blob.

In earlier versions of this library the value you provided in the config for `bucketName` was stored locally. This made it for instance possible to add a file to a bucket without specifying the bucket:

```typescript
storage.addFile("path/to/your/file"); // the file was automatically added to the selected bucket
```

Since version 2.0 you always have to specify the bucket for every bucket action:

```typescript
storage.addFile({
  bucketName: "your-bucket",
  origPath: "path/to/your/file",
  targetPath: "folder/file",
});
```

It can still be useful to provide a bucket name with the config, for instance:

```typescript
storage.addFile({
  bucketName: storage.config.bucketName,
  origPath: "path/to/your/file",
  targetPath: "folder/file",
});
```

### Configuration URL

Configuration urls always start with a protocol that defines the type of storage:

- `local://` &rarr; local storage
- `minio://` &rarr; MinIO
- `b2://` &rarr; Backblaze B2
- `s3://` &rarr; Amazon S3
- `gcs://` &rarr; Google Cloud
- `azure://` &rarr; Azure Blob Storage

These values match the values in the enum `StorageType` shown above. What follows after the `://` is a query string without the initial `?` that contains mandatory and optional parameters for the configuration.

```typescript
// example with extra Azure option "maxTries"
const c = "azure://accountName=your-account&bucketName=your-bucket&maxTries=10";

// internally the config url is converted to a config object:
const c1 = {
  type: StorageType.AZURE,
  accountName: "your-account",
  bucketName: "your-bucket",
  maxTries: 10,
};
```

## Adapters

The adapters are the key part of this library; where the `Storage` is merely a thin wrapper (see [How it works](#how-it-works)), adapters perform the actual actions on the storage by translating generic API methods calls to storage specific calls.

Below follows a description of the available adapters; what the configuration objects and URLs look like and what the default values are. Also per adapter the peer dependencies are listed as a handy copy-pasteble npm command. The peer dependencies are usually wrapper libraries such as aws-sdk but can also be specific modules with a specific functionality such as rimraf for local storage.

If you want to use one or more of the adapters in your project make sure you install the required peer dependencies. By installing only the dependencies that you will actually use, your project codebase will stay as slim and maintainable as possible.

You can also add more adapters yourself very easily, see [below](#adding-more-adapters)

### Local storage

> peer dependencies: <br/> > `npm i glob rimraf`

Adapter config:

```typescript
export interface AdapterConfigLocal extends AdapterConfig {
  directory: string;
  mode?: number;
}
```

Example with configuration object:

```typescript
const s = new Storage({
  type: StorageType.LOCAL,
  directory: "path/to/directory",
  mode: 750,
});
```

Example with configuration url:

```typescript
const s = new Storage("local://directory=path/to/directory&mode=750");
```

With the optional key `mode` you can set the access rights when you create new local buckets. The default value is `0o777`, note that the actual value is dependent on the umask settings on your system (Linux and MacOS only). You can pass this value both in decimal and in octal format. E.g. `rwxrwxrwx` is `0o777` in octal format or `511` in decimal format.

When you use a configuration URL you can only pass values as strings. String values without radix prefix will be interpreted as decimal numbers, so "777" is _not_ the same as "0o777" and yields `41411`. This is probably not what you want. The configuration parser handles this by returning the default value in case you pass a value over decimal `511`.

Examples:

```typescript
const config = {
  type: StorageType.LOCAL,
  directory: "path/to/folder",
  mode: 488, // decimal literal
};
const s = new Storage(config);

// or
const url = "local://directory=path/to/folder&mode=488";
const s = new Storage(url);

// and the same with octal values:

const config = {
  type: StorageType.LOCAL,
  directory: "path/to/folder",
  mode: 0o750, // octal literal
};
const s = new Storage(config);

// or
const url = "local://directory=path/to/folder&mode=0o750";
const s = new Storage(url);
```

Buckets will be created inside the directory `path/to/folder`, parent folders will be created if necessary.

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

### Amazon S3

> peer dependencies: <br/> > `npm i aws-sdk`

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

### Backblaze B2

> peer dependencies: <br/> > `npm i backblaze-b2`

Adapter config:

```typescript
export interface AdapterConfigB2 extends AdapterConfig {
  applicationKey: string;
  applicationKeyId: string;
}
```

Example with configuration object:

```typescript
const s = new Storage({
  type: StorageType.B2,
  applicationKey: "key",
  applicationKeyId: "keyId",
});
```

Example with configuration url:

```typescript
const s = new Storage("b2://applicationKeyId=keyId&applicationKey=key");
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

## API methods

All methods that access the underlying cloud storage service return a promise that always resolves in a `ResponseObject` type or a variant thereof:

```typescript
export interface ResultObject {
  value: string | null;
  error: string | null;
}
```

If the call succeeds the `error` key will be `null` and the `value` key will hold the returned value. This can be a simple string `"ok"` or for instance an array of bucket names

In case the call yields an error, the `value` key will be `null` and the `error` key will hold the error message. Usually this is the error message as sent by the cloud storage service so if necessary you can lookup the error message in the documentation of that service to learn more about the error.

### <a name='createbucket'></a>createBucket

```typescript
createBucket(name: string, options?: object): Promise<ResultObject>;
```

Creates a new bucket.

You can provide extra storage-specific settings such as access rights using the `options` object.

> Note: dependent on the type of storage and the credentials used, you may need extra access rights for this action. E.g.: sometimes a user may only access the contents of one single bucket.

return type:

```typescript
export interface ResultObject {
  value: string | null;
  error: string | null;
}
```

If the bucket was created successfully the `value` key will hold the string "ok".

If the bucket exists or the creating the bucket fails for another reason the `error` key will hold the error message.

### <a name='clearbucket'></a>clearBucket

```typescript
clearBucket(name: string): Promise<ResultObject>;
```

Removes all files in the bucket.

> Note: dependent on the type of storage and the credentials used, you may need extra access rights for this action.

return type:

```typescript
export interface ResultObject {
  value: string | null;
  error: string | null;
}
```

If the call succeeds the `value` key will hold the string "ok".

### <a name='deletebucket'></a>deleteBucket

```typescript
deleteBucket(name: string): Promise<ResultObject>;
```

Deletes the bucket and all files in it.

> Note: dependent on the type of storage and the credentials used, you may need extra access rights for this action.

return type:

```typescript
export interface ResultObject {
  value: string | null;
  error: string | null;
}
```

If the call succeeds the `value` key will hold the string "ok".

### <a name='listbuckets'></a>listBuckets

```typescript
listBuckets(): Promise<ResultObjectBuckets>
```

Returns an array with the names of all buckets in the storage.

> Note: dependent on the type of storage and the credentials used, you may need extra access rights for this action. E.g.: sometimes a user may only access the contents of one single bucket.

return type:

```typescript
export type ResultObjectBuckets = {
  value: Array<string> | null;
  error: string | null;
};
```

### addFile

```typescript
addFile(params: FilePathParams | FileStreamParams | FileBufferParams): Promise<ResultObject>;
```

A generic method that is called under the hood when you call `addFileFromPath`, `addFileFromStream` or `addFileFromBuffer`. It adds a file to a bucket and accepts the file in 3 different ways; as a path, a stream or a buffer, dependent on the type of `params`.

There is no difference between using this method or one of the 3 specific methods. For details about the `params` object and the return value see the documentation below.

### addFileFromPath

```typescript
addFileFromPath(params: FilePathParams): Promise<ResultObject>;

export type FilePathParams = {
  bucketName: string;
  origPath: string;
  targetPath: string;
  options?: {
    [id: string]: any;
  };
};
```

Copies a file from a local path `origPath` to the provided path `targetPath` in the storage. The value for `targetPath` needs to include at least a file name. You can provide extra storage-specific settings such as access rights using the `options` object.

return type:

```typescript
export interface ResultObject {
  value: string | null;
  error: string | null;
}
```

If the call is successful `value` will hold the public url to the file (if the bucket is publicly accessible and the authorized user has sufficient rights).

### addFileFromBuffer

```typescript
addFileFromBuffer(params: FileBufferParams): Promise<ResultObject>;

export type FileBufferParams = {
  bucketName: string;
  buffer: Buffer;
  targetPath: string;
  options?: {
    [id: string]: any;
  };
};

```

Copies a buffer to a file in the storage. The value for `targetPath` needs to include at least a file name. You can provide extra storage-specific settings such as access rights using the `options` object.

This method is particularly handy when you want to move uploaded files directly to the storage, for instance when you use Express.Multer with [MemoryStorage](https://github.com/expressjs/multer#memorystorage).

return type:

```typescript
export interface ResultObject {
  value: string | null;
  error: string | null;
}
```

If the call is successful `value` will hold the public url to the file (if the bucket is publicly accessible and the authorized user has sufficient rights).

### addFileFromStream

```typescript
addFileFromStream(params: FileStreamParams): Promise<ResultObject>;

export type FileStreamParams = {
  bucketName: string;
  stream: Readable;
  targetPath: string;
  options?: {
    [id: string]: any;
  };
};
```

Allows you to stream a file directly to the storage. The value for `targetPath` needs to include at least a file name. You can provide extra storage-specific settings such as access rights using the `options` object.

This method is particularly handy when you want to store files while they are being processed; for instance if a user has uploaded a full-size image and you want to store resized versions of this image in the storage; you can pipe the output stream of the resizing process directly to the storage.

return type:

```typescript
export interface ResultObject {
  value: string | null;
  error: string | null;
}
```

If the call is successful `value` will hold the public url to the file (if the bucket is publicly accessible and the authorized user has sufficient rights).

### getFileAsURL

```typescript
getFileAsURL(bucketName: string, fileName: string, options?: Options): Promise<ResultObjectStream>;
```

param type:

```typescript
export Options {
  [id: string]: any; // eslint-disable-line
}
```

Returns the public url of the file (if the bucket is publicly accessible and the authorized user has sufficient rights).

return type:

```typescript
export type ResultObject = {
  value: string | null;
  error: string | null;
};
```

### getFileAsStream

```typescript
getFileAsStream(bucketName: string, fileName: string, options?: StreamOptions): Promise<ResultObjectStream>;
```

param type:

```typescript
export interface StreamOptions extends Options {
  start?: number;
  end?: number;
}
```

Returns a file in the storage as a readable stream. You can pass in extra options. If you use the keys `start` and/or `end` only the bytes between `start` and `end` of the file will be returned. Some examples:

```typescript
getFileAsReadable("bucket-name", "image.png"); // &rarr; reads whole file

getFileAsReadable("bucket-name", "image.png", {}); // &rarr; reads whole file

getFileAsReadable("bucket-name", "image.png", { start: 0 }); // &rarr; reads whole file

getFileAsReadable("bucket-name", "image.png", { start: 0, end: 1999 }); // &rarr; reads first 2000 bytes

getFileAsReadable("bucket-name", "image.png", { end: 1999 }); // &rarr; reads first 2000 bytes

getFileAsReadable("bucket-name", "image.png", { start: 2000 }); // &rarr; reads file from byte 2000
```

return type:

```typescript
export type ResultObjectStream = {
  value: Readable | null;
  error: string | null;
};
```

### removeFile

```typescript
removeFile(bucketName: string, fileName: string, allVersions: boolean = false): Promise<ResultObject>;
```

Removes a file from the bucket. Does not fail if the file doesn't exist.

return type:

```typescript
export interface ResultObject {
  error: string | null;
  value: string | null;
}
```

If the call succeeds the `value` key will hold the string "ok".

### sizeOf

```typescript
sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;
```

Returns the size of a file.

return type:

```typescript
export type ResultObjectNumber = {
  error: string | null;
  value: number | null;
};
```

If the call succeeds the `value` key will hold the size of the file.

### bucketExists

```typescript
bucketExists(name: string): Promise<ResultObjectBoolean>;
```

Returns whether a bucket exists or not.

return type:

```typescript
export type ResultObjectBoolean = {
  error: string | null;
  value: boolean | null;
};
```

If the call succeeds the `value` key will hold a boolean value.

### fileExists

```typescript
fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>;
```

Returns whether a file exists or not.

return type:

```typescript
export type ResultObjectBoolean = {
  error: string | null;
  value: boolean | null;
};
```

If the call succeeds the `value` key will hold a boolean value.

### listFiles

```typescript
listFiles(bucketName: string): Promise<ResultObjectFiles>;
```

Returns a list of all files in the bucket; for each file a tuple is returned: the first value is the path and the second value is the size of the file.

return type:

```typescript
export type ResultObjectFiles = {
  error: string | null;
  value: Array<[string, number]> | null;
};
```

If the call succeeds the `value` key will hold an array of tuples.

### getType

```typescript
getType(): string;
```

Returns the type of storage, value is one of the enum `StorageType`.

Also implemented as getter:

```typescript
const storage = new Storage(config);
console.log(storage.type);
```

### <a name='getconfiguration'></a>getConfiguration

```typescript
getConfiguration(): AdapterConfig
```

Returns the typed configuration object as provided when the storage was instantiated. If you have provided the configuration in url form, the function will return it as an configuration object.

Also implemented as getter:

```typescript
const storage = new Storage(config);
console.log(storage.config);
```

### getConfigurationError

```typescript
getConfigurationError(): string | null
```

Returns an error message if something has gone wrong with initialization or authorization. Returns `null` otherwise.

Also implemented as getter:

```typescript
const storage = new Storage(config);
console.log(storage.configError);
```

### getServiceClient

```typescript
getServiceClient(): any
```

Returns the instance of the service client of the cloud storage. Under the hood each adapter creates an instance of a service client that actually make connection with the cloud storage.

For instance in the adapter for Amazon S3 an instance of the S3Client of the aws sdk v3 is instantiated; this instance will be returned if you call `getServiceClient` on a storage instance with an S3 adapter.

This method is particularly handy if you need to make API calls that are not implemented in this library.

```typescript
this._client = new S3Client();
```

Also implemented as getter:

```typescript
const storage = new Storage(config);
console.log(storage.serviceClient);
```

### <a name='switchadapter'></a>switchAdapter

```typescript
switchAdapter(config: string | AdapterConfig): void;
```

Switch to another adapter in an existing `Storage` instance at runtime. The config parameter is the same type of object or URL that you use to instantiate a storage. This method can be handy if your application needs a view on multiple storages. If your application needs to copy over files from one storage to another, say for instance from Google Cloud to Amazon S3, then it is more convenient to create 2 separate `Storage` instances. This method is also called by the constructor to instantiate the initial storage type.

## How it works

A `Storage` instance is actually a thin wrapper around one of the available adapters; it creates an instance of an adapter based on the configuration object or url that you provide. Then all API calls to the `Storage` are forwarded to this adapter instance, below a code snippet of the `Storage` class that shows how `createBucket` is forwarded:

```typescript
// member function of class Storage
async createBucket(name: string): Promise<ResultObject> => {
  return this.adapter.createBucket(name);
};
```

The class `Storage` implements the interface `IStorage` and this interface declares the complete API. Because all adapters have to implement this interface as well, either by extending `AbstractAdapter` or otherwise, all API calls on `Storage` can be directly forwarded to the adapters.

The adapter subsequently takes care of translating the generic API calls to storage specific functions. Therefor, dependent on what definitions you use, this library could be seen as a wrapper or a shim.

Inside the adapter an instance of the cloud storage specific service client is created; this instance handles the actual communication with the cloud service. For instance:

```typescript
// Amazon S3 adapter
private const _client = new S3Client();

// Azure Blob Storage adapter
private const _client = new BlobServiceClient();
```

The method `switchAdapter` is not declared in `IStorage` but in the `Storage` class itself; this is because the adapter have to implement `IStorage` and an adapter cannot (and should not) switch itself into another adapter

`switchAdapter` parses the configuration and creates the appropriate adapter instance. This is done by a lookup table that maps a storage type to a path to an adapter module; the module will be loaded in runtime using `require()`.

More adapter classes can be added for different storage types, note however that there are many cloud storage providers that keep their API compliant with Amazon S3, for instance [Wasabi](https://wasabi.com/) and [Cubbit](https://www.cubbit.io/).

## Adding more adapters

If you want to add an adapter you can choose to make your adapter a class or a function; so if you don't like OOP you can implement your adapter using FP or any other coding style or programming paradigm you like.

Your adapter might have additional dependencies such as a service client library like for instance aws-sdk as is used in the Amazon S3 adapter. Add these dependencies to the peer dependencies in the package.json file in the `./publish` folder

This way your extra dependencies will not be installed automatically but have to be installed manually if the user actually uses your adapter in their code.

Please add an npm command to your documentation that users can copy paste to their terminal, e.g. `npm i storage-wrapper additional-module`.

And for library developers you can add your dependencies to the dependencies in the package.json file in the root directory as well because only the files in the publish folder are published to npm.

### Define your configuration

You should add the name of the your type to the enum `StorageType`.

```typescript
// add your type to the enum
enum StorageType {
  LOCAL = "local",
  GCS = "gcs", // Google Cloud Storage
  S3 = "s3", // Amazon S3
  B2 = "b2", // BackBlaze B2
  AZURE = "azure", // Microsoft Azure Blob
  MINIO = "minio",
  YOUR_TYPE = "yourtype",
}
```

Your configuration object type should at least contain a key `type`, you could accomplish this by extending the interface `AdapterConfig`:

```typescript
export interface AdapterConfig {
  type: string;
  bucketName?: string;
  [id: string]: any; // eslint-disable-line
}

export interface YourAdapterConfig extend AdapterConfig {
  additionalKey: string,
  ...
}
```

example:

```typescript
// your configuration object
const o = {
  type: "yourtype", // mandatory
  key1?: string, // other mandatory or optional key that your adapter need for instantiation
  key2?: string,
  ...
}

```

Also your configuration URL should at least contain the type. The name of the type is used for the protocol part of the URL

example:

```typescript
// your configuration URL
const u = "yourtype://key1=value1&key2=value2...";
```

You can format the configuration URL completely as you like as long as your adapter has an appropriate parsing function. If your url is just a query string you can use the `parseURL` function in `./util.ts`; this function is implemented in `AbstractAdapter` and currently not overridden by any of the adapters.

### Adapter class

You could choose to let your adapter class extend the class `AbstractStorage`. If you look at the [code](https://github.com/tweedegolf/storage-abstraction/blob/master/src/AbstractAdapter.ts) you can see that it only implements small parts of the API such as the `getType` method. Also it parses the configuration.

One thing to note is the way `addFileFromPath`, `addFileFromBuffer` and `addFileFromReadable` are implemented; these are all forwarded to the API function `addFile`. This function stores files in the storage using 3 different types of origin; a path, a buffer and a stream. Because these ways of storing have a lot in common they are grouped together in a single overloaded method.

For the rest it contains stub methods that need to be overruled or extended by the adapter subclasses.

You don't necessarily have to extend `AbstractAdapter` but if you choose not to your class should implement the `IStorage` interface. The `parse` function in `AbstractAdapter` is among other util functions defined in the file `./src/util.ts` so you can easily import these in your own class if necessary.

You can use this [template](https://github.com/tweedegolf/storage-abstraction/blob/master/src/template_class.ts) as a starting point for your adapter. The template contains a lot of additional documentation per method.

### Adapter function

The only requirement for this type of adapter is that your module exports a function `createAdapter` that takes a configuration object or URL as parameter and returns an object that has the shape or type of the interface `IStorage`.

If you like, you can use the utility functions defined in `./src/util.js`. Also there is a [template](https://github.com/tweedegolf/storage-abstraction/blob/master/src/template_functional.ts) file that you can use as a starting point for your module.

### Register your adapter

After you've finished your adapter module you need to register it, this requires 3 simple steps:

1] As mentioned earlier the adapters are loaded at runtime, therefor you have to add your type and the path to your module to the lookup table at the top of the file [`./src/Storage.ts`](https://github.com/tweedegolf/storage-abstraction/blob/master/src/Storage.ts#L5).

2] Add your type to the enum `StorageTypes` in `./src/types.ts`.

3] Also in the file `./src/types.ts` add your configuration type that ideally extends `AdapterConfig`.

## Tests

If you want to run the tests you have to checkout the repository from github and install all dependencies with `npm install` or `yarn install`. There are tests for all storage types; note that you may need to add your credentials to a `.env` file, see the file `.env.default` for more explanation, or provide credentials in another way. Also it should be noted that some of these tests require that the credentials allow to create, delete and list buckets.

You can run the Jasmine tests per storage type using one of the following commands:

```bash
# test local disk
npm run test-local
# test Google Cloud Storage
npm run test-gcs
# test Amazon S3
npm run test-s3
# test Backblaze B2
npm run test-b2
```

As you can see in the file `package.json`, the command sets the `type` environment variable which is read by Jasmine.

To run all Jasmine tests consecutively:

```bash
npm run test-all
```

You can find some additional non-Jasmine tests in the file `tests/test.ts`. First select which type of storage you want to test, then uncomment the API calls you want to test, and finally run:

`npm test`

## Example application

> NOTE: not yet updated to API 2.0!

A simple application that shows how you can use the storage abstraction package can be found in [this repository](https://github.com/tweedegolf/storage-abstraction-example). It uses and Ts.ED and TypeORM and it consists of both a backend and a frontend.

## Questions and requests

Please let us know if you have any questions and/or request by creating an [issue](https://github.com/tweedegolf/storage-abstraction/issues).

```

```
