# <a name='storage-abstraction'></a>Storage Abstraction

[![ci](https://github.com/tweedegolf/storage-abstraction/actions/workflows/ci.yaml/badge.svg)](https://github.com/tweedegolf/storage-abstraction/actions/workflows/ci.yaml)

Provides an abstraction layer for interacting with a storage; the storage can be a local file system or a cloud storage service. Supported cloud storage services are:

- MinIO
- Azure Blob
- Backblaze B2
- Google Cloud
- Amazon S3

Also S3 compliant cloud services are supported. Tested S3 compatible services are:

- Backblaze S3
- CloudFlare R2
- Cubbit

The API only provides basic storage operations (see [below](#adapter-api)) and therefor the API is cloud agnostic. This means that you can develop your application using local disk storage and then use for instance Google Cloud or Amazon S3 in your production environment without the need to change any code.

## Table of contents

<!-- toc -->

- [How it works](#how-it-works)
- [Instantiate a storage](#instantiate-a-storage)
  * [Configuration object](#configuration-object)
  * [Configuration URL](#configuration-url)
  * [How bucketName is used](#how-bucketname-is-used)
- [Adapters](#adapters)
- [Adapter Introspect API](#adapter-introspect-api)
  * [getType](#gettype)
  * [getConfiguration](#getconfiguration)
  * [getConfigurationError](#getconfigurationerror)
  * [getServiceClient](#getserviceclient)
- [Adapter API](#adapter-api)
  * [listBuckets](#listbuckets)
  * [listFiles](#listfiles)
  * [bucketExists](#bucketexists)
  * [fileExists](#fileexists)
  * [createBucket](#createbucket)
  * [clearBucket](#clearbucket)
  * [deleteBucket](#deletebucket)
  * [addFile](#addfile)
  * [addFileFromPath](#addfilefrompath)
  * [addFileFromBuffer](#addfilefrombuffer)
  * [addFileFromStream](#addfilefromstream)
  * [getFileAsURL](#getfileasurl)
  * [getFileAsStream](#getfileasstream)
  * [removeFile](#removefile)
  * [sizeOf](#sizeof)
- [Storage API](#storage-api)
  * [getAdapter](#getadapter)
  * [switchAdapter](#switchadapter)
- [Adding an adapter](#adding-an-adapter)
  * [Add your storage type](#add-your-storage-type)
  * [Define your configuration](#define-your-configuration)
  * [Adapter class](#adapter-class)
  * [Adapter function](#adapter-function)
  * [Register your adapter](#register-your-adapter)
  * [Adding your adapter code to this package](#adding-your-adapter-code-to-this-package)
- [Tests](#tests)
- [Example application](#example-application)
- [Questions and requests](#questions-and-requests)

<!-- tocstop -->

## How it works

A `Storage` instance is a thin wrapper around one of the available adapters. These adapters are peer dependencies and available as separate packages on npm. This way your code base stays as slim as possible because you only have to add the adapter(s) that you need to your project.

List of available adapters:

- [Local file system](https://www.npmjs.com/package/@tweedegolf/sab-adapter-local) `npm i @tweedegolf/sab-adapter-local`
- [Amazon S3 (and compatible)](https://www.npmjs.com/package/@tweedegolf/sab-adapter-amazon-s3) `npm i @tweedegolf/sab-adapter-amazon-s3`
- [Google cloud](https://www.npmjs.com/package/@tweedegolf/sab-adapter-google-cloud) `npm i @tweedegolf/sab-adapter-google-cloud`
- [Backblaze B2](https://www.npmjs.com/package/@tweedegolf/sab-adapter-backblaze-b2) `npm i @tweedegolf/sab-adapter-backblaze-b2`
- [Azure Blob](https://www.npmjs.com/package/@tweedegolf/sab-adapter-azure-blob) `npm i @tweedegolf/sab-adapter-azure-blob`
- [MinIO](https://www.npmjs.com/package/@tweedegolf/sab-adapter-minio) `npm i @tweedegolf/sab-adapter-minio`

When you create a `Storage` instance it creates an instance of an adapter based on the configuration object or url that you provide. Then all API calls to the `Storage` are forwarded to this adapter instance, below a code snippet of the `Storage` class that shows how `createBucket` is forwarded:

```typescript
// member function of class Storage
public async createBucket(name: string): Promise<ResultObject> {
  return this.adapter.createBucket(name);
}
```

The class `Storage` implements the interface `IAdapter` and this interface declares the complete API. Because all adapters have to implement this interface as well, either by extending `AbstractAdapter` or otherwise, all API calls on `Storage` can be directly forwarded to the adapters.

The adapter subsequently creates an instance of the cloud storage specific service client and this instance handles the actual communication with the cloud service. For instance:

```typescript
// Amazon S3 adapter
private const _client = new S3Client();

// Azure Blob Storage adapter
private const _client = new BlobServiceClient();
```

Therefor, dependent on what definitions you use, this library could be seen as a wrapper or a shim.

## Instantiate a storage

```javascript
const s = new Storage(config);
```

When you create a new `Storage` instance the `config` argument is used to instantiate the right adapter. You can provide the `config` argument in 2 forms:

1. using a configuration object (js: `typeof === "object"` ts: `AdapterConfig`)
2. using a configuration URL (`typeof === "string"`)

Internally the configuration URL will be converted to a configuration object so any rule that applies to a configuration object also applies to configuration URLs.

The configuration must at least specify a type; the type is used to determine which adapter should be created. Note that the adapters are peer dependencies and not included in the Storage Abstraction project so you have to add them to you project before you can use them.

The value of the type is one of the enum members of `StorageType`:

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

The Storage instance is only interested in the type so it checks if the type is valid and then passes the rest of the configuration on to the adapter constructor. It is the responsibility of the adapter to perform further checks on the configuration. I.e. if all mandatory values are available such as credentials or an endpoint.

### Configuration object

To enforce that the configuration object contains a `type` key, it expects the configuration object to be of type `StorageAdapterConfig`

```typescript
interface AdapterConfig {
  bucketName?: string;
  [id: string]: any; // any service specific mandatory or optional key
}

interface StorageAdapterConfig extends AdapterConfig {
  type: string;
}
```

Besides the mandatory key `type` one or more keys may be mandatory or optional dependent on the type of adapter; for instance keys for passing credentials such as `keyFilename` for Google Storage or `accessKeyId` and `secretAccessKey` for Amazon S3, and keys for further configuring the storage service such as `StoragePipelineOptions` for Azure Blob.

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

### How bucketName is used

In earlier versions of this library the value you provided in the configuration for `bucketName` was stored locally. This made it for instance possible to add a file to a bucket without specifying the bucket:

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

It can still be useful to provide a bucket name with the configuration, for instance:

```typescript
storage.addFile({
  bucketName: storage.config.bucketName,
  origPath: "path/to/your/file",
  targetPath: "folder/file",
});
```

## Adapters

The adapters are the key part of this library; where the `Storage` is merely a thin wrapper, adapters perform the actual actions on the cloud storage by translating generic API methods calls to storage specific calls. The adapters are peer dependencies and not part of the Storage Abstraction package; you need to install the separately. See [How it works](#how-it-works).

A description of the available adapters; what the configuration objects and URLs look like and what the default values are can be found in the README of the adapter packages:

| type          | npm command                                  | readme                                                                                                    |
| ------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Local storage | `npm i @tweedegolf/sab-adapter-local`        | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-local?activeTab=readme)        |
| Amazon S3     | `npm i @tweedegolf/sab-adapter-amazon-s3`    | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-amazon-s3?activeTab=readme)    |
| Google Cloud  | `npm i @tweedegolf/sab-adapter-google-cloud` | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-google-cloud?activeTab=readme) |
| Azure Blob    | `npm i @tweedegolf/sab-adapter-azure-blob`   | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-azure-blob?activeTab=readme)   |
| MinIO         | `npm i @tweedegolf/sab-adapter-minio`        | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-minio?activeTab=readme)        |
| Backblaze B2  | `npm i @tweedegolf/sab-adapter-backblaze-b2` | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-backblaze-b2?activeTab=readme) |

You can also add more adapters yourself very easily, see [below](#adding-more-adapters)

## Adapter Introspect API

These methods can be used to introspect the adapter. Unlike all other methods, these methods do not return a promise but return a value immediately.

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

### getConfiguration

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

Under the hood some adapters create an instance of a service client that actually makes connection with the cloud storage. If that is the case, this method returns the instance of that service client.

For instance in the adapter for Amazon S3 an instance of the S3Client of the aws sdk v3 is instantiated; this instance will be returned if you call `getServiceClient` on a storage instance with an S3 adapter.

```typescript
// inside the Amazon S3 adapter an instance of the S3Client is created. S3Client is part of the aws-sdk
this._client = new S3Client();
```

This method is particularly handy if you need to make API calls that are not implemented in this library. The example below shows how the `CopyObjectCommand` is used directly on the service client. The API of the Storage Abstraction does not (yet) offer a method to copy an object that is already stored in the cloud service so this can be a way to circumvent that.

```typescript
const storage = new Storage(config);
const client = storage.getServiceClient();

const input = {
  Bucket: "destinationbucket",
  CopySource: "/sourcebucket/HappyFacejpg",
  Key: "HappyFaceCopyjpg",
};
const command = new CopyObjectCommand(input);
const response = await client.send(command);
```

Also implemented as getter:

```typescript
const storage = new Storage(config);
console.log(storage.serviceClient);
```

## Adapter API

These methods are actually accessing the underlying cloud storage service. All these methods are async and return a promise that always resolves in a `ResponseObject` type or a variant thereof:

```typescript
export interface ResultObject {
  value: string | null;
  error: string | null;
}
```

If the call succeeds the `error` key will be `null` and the `value` key will hold the returned value. This can be a simple string `"ok"` or for instance an array of bucket names

In case the call yields an error, the `value` key will be `null` and the `error` key will hold the error message. Usually this is the error message as sent by the cloud storage service so if necessary you can lookup the error message in the documentation of that service to learn more about the error.

### listBuckets

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

### bucketExists

```typescript
bucketExists(name: string): Promise<ResultObjectBoolean>;
```

Check whether a bucket exists or not.

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

Check whether a file exists or not.

return type:

```typescript
export type ResultObjectBoolean = {
  error: string | null;
  value: boolean | null;
};
```

If the call succeeds the `value` key will hold a boolean value.

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

## Storage API

The Storage class has two extra method besides all methods of the `IAdapter` interface.

### <a name='getadapter'></a>getAdapter

```typescript
getAdapter(): IAdapter;

// also implemented as getter
const s = new Storage({type: StorageType.S3})
const a = s.adapter;
```

Returns the instance of the Adapter class that this Storage instance is currently using to access a storage service.

### <a name='switchadapter'></a>switchAdapter

```typescript
switchAdapter(config: string | AdapterConfig): void;
```

This method is used to instantiate the right adapter when you create a Storage instance. The method can also be used to switch to another adapter in an existing Storage instance at runtime.

The config parameter is the same type of object or URL that you use to instantiate a Storage. This method can be handy if your application needs a view on multiple storages.

If your application needs to copy over files from one storage service to another, say for instance from Google Cloud to Amazon S3, then it is more convenient to create 2 separate Storage instances:

```typescript
import { Storage } from "@tweedegolf/storage-abstraction"
import { AdapterAmazonS3 } from "@tweedegolf/sab-adapter-amazon-s3";
import { AdapterGoogleCloud } from "@tweedegolf/sab-adapter-google-cloud";

const s1 = new Storage({type: "s3"});
const s2 = new Storage({type: "gcs"});

s2.addFile({
  bucketName: "bucketOnGoogleCloud"
  stream: s1.getFileAsStream("bucketOnAmazon", "some-image.png"),
  targetPath: "copy-of-some-image.png",
})

```

## Adding an adapter

It is relatively easy to add an adapter for an unsupported cloud service. Note however that many cloud storage services are compatible with Amazon S3 so if that is the case, please check first if the Amazon S3 adapter does the job; it might work right away. Sometimes even if a storage service is S3 compatible you have to write a separate adapter. For instance: although MinIO is S3 compliant it was necessary to write a separate adapter for MinIO.

If you want to add an adapter you can choose to make your adapter a class or a function; so if you don't like OOP you can implement your adapter using FP or any other coding style or programming paradigm you like.

Your adapter might have additional dependencies such as a service client library like for instance aws-sdk as is used in the Amazon S3 adapter. Add these dependencies to the package.json file in the `./publish/YourAdapter` folder.

Please add your dependencies also to the package.json file in the root folder of the Storage Abstraction package in case you add some tests for your adapter. Your dependencies will not be added to the Storage Abstraction package because only the files in the publish folder are published to npm and there is a stripped version of the package.json file in the `./publish/Storage` folder. You could publish your adapter to npm and add it as a peer dependency to this package.json.

Follow these steps:

1. Add a new type to the `StorageType` enum in `./src/types/general.ts`
2. Define a configuration object (and a configuration url if you like)
3. Write your adapter, make sure it implements all API methods
4. Register your adapter in `./src/adapters.ts`
5. Publish your adapter on npm and add it as a peer dependency to the Storage Abstraction package in `./publish/Storage/package.json`. You may also want to add the newly supported storage service to the keywords array.

### Add your storage type

You should add the name of the your type to the enum `StorageType` in `./src/types/general.ts`. It is not mandatory but may be very handy.

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

### Define your configuration

A configuration object type should at least contain a key `type`. To enforce this the Storage class expects the config object to be of type `StorageAdapterConfig`:

```typescript
export interface AdapterConfig {
  bucketName?: string;
  [id: string]: any; // eslint-disable-line
}

export interface StorageAdapterConfig extends AdapterConfig {
  type: string;
}
```

For your custom configuration object you can either choose to extend `StorageAdapterConfig` or `AdapterConfig`. If you choose the latter you can use your adapter standalone without having to provide a redundant key `type`, which is why the configuration object of all existing adapters extend `AdapterConfig`.

```typescript
export interface YourAdapterConfig extends AdapterConfig {
  additionalKey: string,
  ...
}

const s = new Storage({
  type: StorageType.YOUR_TYPE, // mandatory for Storage
  key1: string, // other mandatory or optional key that your adapter need for instantiation
  key2: string,
}) // works!

const a = new YourAdapter({
  key1: string,
  key2: string,

}) // works, type is not mandatory
```

Also your configuration URL should at least contain the type. The name of the type is used for the protocol part of the URL. Upon instantiation the Storage class checks if a protocol is present on the provided url.

example:

```typescript
// your configuration URL
const u = "yourtype://key1=value1&key2=value2...";
```

You can format the configuration URL completely as you like as long as your adapter has an appropriate function to parse it in an object. If your url is just a query string you don't need to write a parse function, you can either use the parse function of `AbstractAdapter` by extending this class or import the `parseUrl` or `parseQueryString` function from `./src/util.ts`.

### Adapter class

You could choose to let your adapter class extend the class `AbstractStorage`. If you look at the [code](https://github.com/tweedegolf/storage-abstraction/blob/master/src/AbstractAdapter.ts) you can see that it only implements small parts of the API such as the `getType` method. Also it parses the configuration url into an object.

One thing to note is the way `addFileFromPath`, `addFileFromBuffer` and `addFileFromReadable` are implemented; these are all forwarded to the API function `addFile`. This function stores files in the storage using 3 different types of origin; a path, a buffer and a stream. Because these ways of storing have a lot in common they are grouped together in a single overloaded method.

The abstract stub methods need to be implemented and the other `IAdapter` methods need to be overruled the adapter subclasses. Note that your adapter should not implement the Storage methods `getAdapter` and `switchAdapter`

You don't necessarily have to extend `AbstractAdapter` but if you choose not to your class should implement the `IAdapter` interface. You'll find some configuration parse functions in `./src/util.ts` so you can easily import these in your own class if necessary.

You can use this [template](https://github.com/tweedegolf/storage-abstraction/blob/master/src/template_class.ts) as a starting point for your adapter. The template contains a lot of additional documentation per method.

### Adapter function

The only requirement for this type of adapter is that your module exports a function `createAdapter` that takes a configuration object or URL as parameter and returns an object that has the shape or type of the interface `IAdapter`.

You may want to check if you can use some of the utility functions defined in `./src/util.js`. Also there is a [template](https://github.com/tweedegolf/storage-abstraction/blob/master/src/template_functional.ts) file that you can use as a starting point for your module.

### Register your adapter

The `switchAdapter` method of Storage parses the type from the configuration and then creates the appropriate adapter instance. This is done by a lookup table that maps a storage type to a tuple that contains the name of the adapter and the path to the adapter module:

```typescript
export const adapterClasses = {
  s3: ["AdapterAmazonS3", "@tweedegolf/sab-adapter-amazon-s3"],
  your_type: ["AdapterYourService", "@you/sab-adapter-your-service"],
  ...
};
```

If `switchAdapter` fails to find the module at the specified path it tries to find it in the source folder by looking for a file that has the same name as your adapter, so in the example above it looks for `./src/AdapterYourService.ts`.

Once the module is found it will be loaded at runtime using `require()`. An error will be thrown the type is not declared or if the module can not be found.

The lookup table is defined in `./src/adapters.ts`.

### Adding your adapter code to this package

You can create your own adapter in a separate repository and publish it from there to npm. You may also want to add your adapter code to this package, to do this follow these steps:

1. Place the adapter in the `./src` folder
2. Create a file that contains all your types in the `./src/types` folder
3. Create an index file in the `./src/indexes` folder
4. Create a folder with the same name as your adapter in the `./publish` folder
5. Add a package.json and a README.md file to this folder
6. Add your adapter to the `copy.ts` file in the root folder

## Tests

If you want to run the tests you have to checkout the repository from github and install all dependencies with `npm install` or `yarn install`. There are tests for all storage types; note that you may need to add your credentials to a `.env` file, see the file `.env.default` for more explanation, or provide credentials in another way. Also it should be noted that some of these tests require that the credentials allow to create, delete and list buckets.

You can run the Jasmine tests per storage type using one of the following commands:

```bash
# test local disk
npm run test-local
# or
npm run test-jasmine 0

# test Amazon S3
npm run test-s3
# or
npm run test-jasmine 1

# test Backblaze B2
npm run test-b2
# or
npm run test-jasmine 2

# test Google Cloud Storage
npm run test-gcs
# or
npm run test-jasmine 3

# test Azure Blob Storage
npm run test-azure
# or
npm run test-jasmine 4

# test MinIO
npm run test-minio
# or
npm run test-jasmine 5

# test Cubbit
npm run test-jasmine 6

# test Cloudflare R2
npm run test-jasmine 7

# test Backblaze B2 S3 API
npm run test-jasmine 8
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
