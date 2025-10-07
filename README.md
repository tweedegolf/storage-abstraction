# <a name='storage-abstraction'></a>Storage Abstraction

[![ci](https://github.com/tweedegolf/storage-abstraction/actions/workflows/ci.yaml/badge.svg?branch=master)](https://github.com/tweedegolf/storage-abstraction/actions/workflows/ci.yaml)

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

<!--start_toc-->

Documentation|Adapter API|Introspective API|Storage API
:---|:---|:---|:---
[1. How it works](README.md#how-it-works)|[listBuckets](README.md#listbuckets)           |[getType](README.md#gettype)|[getAdapter](README.md#getadapter)
[2. Instantiate a storage](README.md#instantiate-a-storage)|[listFiles](README.md#listfiles)        |[getConfiguration](README.md#getconfiguration)|[switchAdapter](README.md#switchadapter)
[a. Configuration object](README.md#configuration-object)|[bucketIsPublic](README.md#bucketispublic)|[getConfigurationError](README.md#getconfigurationerror)|
&nbsp; [b. Configuration URL](README.md#configuration-url)|[bucketExists](README.md#bucketexists)  |[getServiceClient](README.md#getserviceclient)|
&nbsp; [c. How bucketName is used](README.md#how-bucketname-is-used)|[fileExists](README.md#fileexists)         |[getSelectedBucket](README.md#getselectedbucket)|
[3. Adapters](README.md#adapters)|[createBucket](README.md#createbucket)|[setSelectedBucket](README.md#setselectedbucket)|
[4. Adding an adapter](README.md#adding-an-adapter)|[clearBucket](README.md#clearbucket)||
&nbsp; [a. Add your storage type](README.md#add-your-storage-type)|[deleteBucket](README.md#deletebucket)||
&nbsp; [b. Define your configuration](README.md#define-your-configuration)|[addFile](README.md#addfile)||
&nbsp; [c. Adapter class](README.md#adapter-class)|[addFileFromPath](README.md#addfilefrompath)||
&nbsp; [d. Adapter function](README.md#adapter-function)|[addFileFromBuffer](README.md#addfilefrombuffer)||
&nbsp; [e. Register your adapter](README.md#register-your-adapter)|[addFileFromStream](README.md#addfilefromstream) ||
&nbsp; [f. Adding your adapter code to this package](README.md#adding-your-adapter-code-to-this-package)|[getPresignedUploadURL](README.md#getPresignedUploadURL)||
[5. Tests](README.md#tests)|[getPublicURL](README.md#getpublicurl)||
[6. Example application](README.md#example-application)|[getSignedURL](README.md#getsignedurl) ||
[7. Questions and requests](README.md#questions-and-requests)|[getFileAsStream](README.md#getfileasstream)||
&nbsp;|[removeFile](README.md#removefile)||
|[sizeOf](README.md#sizeof)||

<!--end_toc-->

## How it works

A `Storage` instance is a thin wrapper around one of the available adapters. These adapters are available as separate packages on npm. This way your code base stays as slim as possible because you only have to add the adapter(s) that you need to your project.

Most adapters are wrappers around the cloud storage service specific service clients, e.g. the AWS SDK.

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

The configuration must at least specify a provider; the provider is used to determine which adapter should be created. Note that the adapters are not included in the Storage Abstraction package so you have to add them to you project's package.json before you can use them.

The value of the type is one of the enum members of `Provider`:

```typescript
export enum Provider {
  NONE = "none",    // initial value for the abstract adapter, don't use this one
  LOCAL = "local",  // local testing adapter
  GCS = "gcs",      // Google Cloud Storage
  GS = "gs",        // Google Cloud Storage
  S3 = "s3",        // Amazon S3
  AWS = "aws",      // Amazon S3
  AZURE = "azure",  // Azure Storage Blob
  B2 = "b2",              // BackBlaze B2 using native API with AdapterBackblazeB2
  BACKBLAZE = "b2",       // BackBlaze B2 using native API with AdapterBackblazeB2
  B2_S3 = "b2-s3",        // Backblaze B2 using S3 API with AdapterAmazonS3
  BACKBLAZE_S3 = "b2-s3", // Backblaze B2 using S3 API with AdapterAmazonS3
  MINIO = "minio",        // Minio using native API with AdapterMinio
  MINIO_S3 = "minio-s3",  // Minio using S3 API with AdapterAmazonS3
  CUBBIT = "cubbit",      // Cubbit uses S3 API with AdapterAmazonS3  
  R2 = "r2",              // Cloudflare R2 uses S3 API with AdapterAmazonS3    
  CLOUDFLARE = "r2",      // Cloudflare R2 uses S3 API with AdapterAmazonS3   
}
```

The Storage instance is only interested in the provider so it checks if the provider is valid and then passes the rest of the configuration on to the adapter constructor. It is the responsibility of the adapter to perform further checks on the configuration. I.e. if all mandatory values are available such as credentials or an endpoint.

>[!NOTE]
> Although there are 15 members in the enum, there are only 6 adapters supporting 7 different cloud storage providers. The providers Minio and Backblaze B2 have both a native API and support for the S3 API.

### Configuration object

To enforce that the configuration object contains a `provider` key, it expects the configuration object to be of type `StorageAdapterConfig`

```typescript
interface AdapterConfig {
  bucketName?: string;
  [id: string]: any; // any service specific mandatory or optional key
}

interface StorageAdapterConfig extends AdapterConfig {
  provider: Provider;
}
```

Besides the mandatory key `provider` one or more keys may be mandatory or optional dependent on the provider; for instance keys for passing credentials such as `keyFilename` for Google Storage or `accessKeyId` and `secretAccessKey` for Amazon S3, and keys for further configuring the storage service such as `StoragePipelineOptions` for Azure Blob.

### Configuration URL

The general format of configuration urls is:

```typescript
const u = "protocol://username:password@host:port/path/to/object?region=auto&option2=value2...";
```

For most storage services `username` and `password` are the credentials, such as key id and secret but this is not mandatory; you may use these values for other purposes.

The protocol part of the url defines the storage provider and should be one of the members of the `Provider` type:

- `local://` &rarr; local storage
- `minio://` &rarr; MinIO
- `minio-s3://` &rarr; MinIO S3 API
- `b2://` &rarr; Backblaze B2
- `backblaze://` &rarr; Backblaze B2
- `b2-s3://` &rarr; Backblaze B2 S3 API
- `backblaze-s3://` &rarr; Backblaze B2 S3 API
- `s3://` &rarr; Amazon S3
- `aws://` &rarr; Amazon S3
- `gcs://` &rarr; Google Cloud
- `gs://` &rarr; Google Cloud
- `azure://` &rarr; Azure Blob Storage
- `r2://` &rarr; Cloudflare R2 Storage
- `cloudflare://` &rarr; Cloudflare R2 Storage
- `cubbit://` &rarr; Cubbit Storage

Note that some providers can be addressed by multiple protocols, e.g. for Amazon S3 you can use both `aws` and `s3`.

<!--
```typescript
// example with extra Azure option "maxTries"
const c = "azure://account_name:account_key@bucket_name?maxTries=10";

// internally the config url is converted to a config object:
const c1 = {
  type: Provider.AZURE,
  accountName: "account_name",
  accountKey: "account_key",
  bucketName: "bucket_name",
  maxTries: 10,
};
```
// -->

The url parser generates a generic object with generic keys that resembles the standard javascript [URL object](https://developer.mozilla.org/en-US/docs/Web/API/URL). This object will be converted to the adapter specific AdapterConfig format in the constructor of the adapter. When converted the `searchParams` object will be flattened into the config object, for example:

```typescript
// port and bucket
const u = "s3://key:secret@the-buck/path/to/object?region=auto&option2=value2";

// output parser
const p = {
  protocol: "s3",
  username: "key",
  password: "secret",
  host: "the-buck",
  port: null,
  path: "path/to/object",
  searchParams: {
    region: "auto",
    option2: "value2",
  },
};

// AdapterConfigAmazonS3
const c = {
  type: "s3",
  accessKeyId: "key",
  secretAccessKey: "secret",
  bucketName: "the-buck",
  region: "auto",
  option2: "value2",
};
```

The components of the url represent config parameters and because not all adapters require the same and/or the same number of parameters, not all components of the url are mandatory. When you leave certain components out, it may result in an invalid url according to the [official specification](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier) but the parser will parse them anyway.

```typescript
// port and bucket
const u = "s3://part1:part2@bucket:9000/path/to/object?region=auto&option2=value2";
const p = {
  protocol: "s3",
  username: "part1",
  part2: "part2",
  host: "bucket",
  port: "9000",
  path: "path/to/object",
  searchParams: { region: "auto", option2: "value2" },
};

// no bucket but with @
const u = "s3://part1:part2@:9000/path/to/object?region=auto&option2=value2";
const p = {
  protocol: "s3",
  username: "part1",
  password: "part2",
  host: null,
  port: "9000",
  path: "path/to/object",
  searchParams: { region: "auto", option2: "value2" },
};

// no bucket
const u = "s3://part1:part2:9000/path/to/object?region=auto&option2=value2";
const p = {
  protocol: "s3",
  username: "part1",
  password: "part2",
  host: null,
  port: "9000",
  path: "path/to/object",
  searchParams: { region: "auto", option2: "value2" },
};

// no credentials, note: @ is mandatory in order to be able to parse the bucket name
const u = "s3://@bucket/path/to/object?region=auto&option2=value2";
const p = {
  protocol: "s3",
  username: null,
  password: null,
  host: "bucket",
  port: null,
  path: "path/to/object",
  searchParams: { region: "auto", option2: "value2" },
};

// no credentials, no bucket
const u = "s3:///path/to/object?region=auto&option2=value2";
const p = {
  protocol: "s3",
  username: "/path/to/object",
  password: null,
  host: null,
  port: null,
  path: null,
  searchParams: { region: "auto", option2: "value2" },
};

// no credentials, no bucket, no extra options (query string)
const u = "s3:///path/to/object";
const p = {
  protocol: "s3",
  username: "/path/to/object",
  password: null,
  host: null,
  port: null,
  path: null,
  searchParams: null,
};

// only protocol
const u = "s3://";
const p = {
  protocol: "s3",
  username: null,
  password: null,
  host: null,
  port: null,
  path: null,
  searchParams: null,
};

// absolutely bare
const u = "s3";
const p = {
  protocol: "s3",
  username: null,
  password: null,
  host: null,
  port: null,
  path: null,
  searchParams: null,
};
```

### How bucketName is used

If you provide a bucket name it will be stored in the state of the Storage instance. This makes it for instance possible to add a file to a bucket without specifying the name of bucket:

```typescript
storage.addFile("path/to/your/file"); // the file was automatically added to the selected bucket
```

Note that if the bucket does not exist it will not be created automatically for you when you create a Storage instance! This was the case in earlier versions but as of version 2.0.0 you have to create the bucket yourself using `createBucket`.

## Adapters

The adapters are the key part of this library; where the `Storage` is merely a thin wrapper, adapters perform the actual actions on the cloud storage by translating generic API methods calls to storage provider specific calls. The adapters are not part of the Storage Abstraction package; you need to install the separately. See [How it works](#how-it-works).

A description of the available adapters; what the configuration objects and URLs look like and what the default values are can be found in the README of the adapter packages:

| provider          | npm command                                  | readme                                                                                                    |
| ------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Local storage | `npm i @tweedegolf/sab-adapter-local`        | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-local?activeTab=readme)        |
| Amazon S3     | `npm i @tweedegolf/sab-adapter-amazon-s3`    | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-amazon-s3?activeTab=readme)    |
| Cubbit        | `npm i @tweedegolf/sab-adapter-amazon-s3`    | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-amazon-s3?activeTab=readme)    |
| Cloudflare R2 | `npm i @tweedegolf/sab-adapter-amazon-s3`    | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-amazon-s3?activeTab=readme)    |
| MinIO S3      | `npm i @tweedegolf/sab-adapter-amazon-s3`    | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-amazon-s3?activeTab=readme)    |
| Backblaze B2 S3 | `npm i @tweedegolf/sab-adapter-amazon-s3`  | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-amazon-s3?activeTab=readme)    |
| Google Cloud  | `npm i @tweedegolf/sab-adapter-google-cloud` | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-google-cloud?activeTab=readme) |
| Azure Blob    | `npm i @tweedegolf/sab-adapter-azure-blob`   | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-azure-blob?activeTab=readme)   |
| MinIO         | `npm i @tweedegolf/sab-adapter-minio`        | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-minio?activeTab=readme)        |
| Backblaze B2  | `npm i @tweedegolf/sab-adapter-backblaze-b2` | [**npm.com&#8599;**](https://www.npmjs.com/package/@tweedegolf/sab-adapter-backblaze-b2?activeTab=readme) |

You can also add more adapters yourself very easily, see [below](#adding-more-adapters).

>[!NOTE] 
> Note that the Amazon S3 adapter also supports Cubbit, Cloudflare R2 and the S3 API of Backblaze B2 and Minio.

## Adapter Introspect API

These methods can be used to introspect the adapter. Unlike all other methods, these methods do not return a promise but return a value immediately.

### getProvider

```typescript
getProvider(): Provider;
```

Returns the cloud storage provider, value is a member of the enum `Provider`.

Also implemented as getter:

```typescript
const storage = new Storage(config);
console.log(storage.provider);
```
<hr>

### getSelectedBucket

```typescript
getSelectedBucket(): null | string
```

Returns the name of the bucket that you've provided with the config upon instantiation or that you've set afterwards using `setSelectedBucket`

Also implemented as getter:

```typescript
const storage = new Storage(config);
console.log(storage.bucketName);
```
<hr>

### setSelectedBucket

```typescript
setSelectedBucket(null | string): void
```

Sets the name of the bucket that will be stored in the local state of the Adapter instance. This overrides the value that you may have provided with the config upon instantiation. You can also clear this value by passing `null` as argument.

If you use this method to select a bucket you don't have to provide a bucket name when you call any of these methods:

- `createBucket`
- `clearBucket`
- `deleteBucket`
- `bucketExists`
- `bucketIsPublic`
- `addFile`, `addFileFromStream`, `addFileFromBuffer`, `addFileFromPath`
- `getFileAsStream`
- `getPublicURL`, `getSignedURL`
- `fileExists`
- `removeFile`
- `listFiles`
- `sizeof`

Also implemented as setter:

```typescript
const storage = new Storage(config);
storage.bucketName = "the-buck-2";
```

<hr>

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

<hr>

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

<hr>

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

If the call succeeds the `error` key will be `null` and the `value` key will hold the returned value. This can be a simple string `"ok"`, a status message, a warning or for instance an array of bucket names.

In case the call yields an error, the `value` key will be `null` and the `error` key will hold the error message. Usually this is the error message as sent by the cloud storage service so if necessary you can lookup the error message in the documentation of that service to learn more about the error.

### listBuckets

```typescript
listBuckets(): Promise<ResultObjectBuckets>
```

return type:

```typescript
export type ResultObjectBuckets = {
  value: Array<string> | null;
  error: string | null;
};
```

Returns an array with the names of all buckets in the storage.

> [!NOTE]
> dependent on the type of storage and the credentials used, you may need extra access rights for this action. E.g.: sometimes a user may only access the contents of one single bucket.

<hr>

### listFiles

```typescript
listFiles(...args:
  [bucketName?: string, numFiles?: number] |
  [numFiles?: number] |
  [bucketName?: string]
)): Promise<ResultObjectFiles>;
```

return type:

```typescript
export type ResultObjectFiles = {
  error: string | null;
  value: Array<[string, number]> | null;
};
```

Returns a list of all files in the bucket; for each file a tuple is returned: the first value is the path and the second value is the size of the file. If the call succeeds the `value` key will hold an array of tuples.

The `bucketName` arg is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will set to `"no bucket selected"`.

<hr>

### bucketIsPublic

```typescript
bucketIsPublic(bucketName?: string): Promise<ResultObjectBoolean>;
```

return type:

```typescript
export type ResultObjectBoolean = {
  error: string | null;
  value: boolean | null;
};
```
Check if the bucket is publicly accessible.

The `bucketName` arg is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will set to `"no bucket selected"`.

>[!NOTE]
> Both Cloudflare R2 and Cubbit do not provide a way to check if a bucket is public. You have to check this in the respective web consoles.

>[!NOTE]
> If you are connected to Azure using a SAS token this method will return an error: "This request is not authorized to perform this operation using this permission."
> Please use any of the other ways to login to Azure if you want to use this method. 

<hr>

### bucketExists

```typescript
bucketExists(bucketName?: string): Promise<ResultObjectBoolean>;
```

return type:

```typescript
export type ResultObjectBoolean = {
  error: string | null;
  value: boolean | null;
};
```

Check whether a bucket exists or not. If the call succeeds the `value` key will hold a boolean value.

The `bucketName` arg is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will set to `"no bucket selected"`.

<hr>

### fileExists

```typescript
fileExists(...args:
  [bucketName: string, fileName: string] |
  [fileName: string]
): Promise<ResultObjectBoolean>;
```

return type:

```typescript
export type ResultObjectBoolean = {
  error: string | null;
  value: boolean | null;
};
```

Check whether a file exists or not. If the call succeeds the `value` key will hold a boolean value.

The `bucketName` arg is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will set to `"no bucket selected"`.

<hr>

### createBucket

```typescript
createBucket(...args:
  [bucketName?: string, options?: Options] |
  [options?: Options]
): Promise<ResultObject>;
```

```typescript
type Options {
  public: boolean, 
  [anykey]: any
};
```

return type:

```typescript
export interface ResultObject {
  value: string | null;
  error: string | null;
}
```

Creates a new bucket. If successful, value will hold a string "ok". You can provide extra storage-specific settings such as access rights using the `options` object. 

If you want to create a public bucket add a key `public` to the options object and set its value to `true`. 

By default a bucket is private and has no versioning.

Fails if the bucket already exists. This is done because bucket names must be globally unique so if the bucket already exists it might have been created by someone else and may therefor not be accessible for you.

>[!NOTE]
> Setting `public` to true equals `access='blob'` in Azure Blob Storage; if you want to set your bucket to another access level you add it to the options object: 
> ```typescript
> // set custom access level
> createBucket("test", {access: "container"});
>```

>[!NOTE]
> You cannot create a public bucket if you use the AmazonS3 adapter with Backblaze or Cloudflare R2; please use the web console of these services to make your bucket public.

>[!NOTE]
> If you use the AmazonS3 adapter with Cubbit you can create a public bucket but if you want the files stored in the bucket to be public as well you need to add `{ACL: "public-read"}` or `{ACL: "public-read-write"}` to the options object of `addFileFromPath`, `addFileFromBuffer` and `addFileFromStream` as well:
>```typescript
> addFileFromPath({
>   bucketName: "test",
>   origPath: "path/to/your/file.ext",
>   targetPath: "new-name.ext",
>   options: {
>     ACL: "public-read"
>   }
>});
>```
> Note that adding `{ACL: "public-read"}` or `{ACL: "public-read-write"}` also makes files in a private bucket publicly accessible!


If the bucket was created successfully the `value` key will hold the string "ok". 

If you wanted to create a public bucket and the bucket couldn't be made public for instance because you use the AmazonS3 adapter i.c.w. Backblaze or Cloudflare R2, `value` will hold `Bucket ${bucketName} created successfully but you can only make this bucket public using the web console`.

If the bucket exists or if creating the bucket fails for another reason the `error` key will hold the error message.

The `bucketName` arg is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will set to `"no bucket selected"`.

> [!NOTE] 
> dependent on the type of storage and the credentials used, you may need extra access rights for this action. E.g.: sometimes a user may only access the contents of one single bucket and has no rights to create a new bucket. Additionally you may not have the rights to create a public bucket.

<hr>

### clearBucket

```typescript
clearBucket(bucketName?: string): Promise<ResultObject>;
```

return type:

```typescript
export interface ResultObject {
  value: string | null;
  error: string | null;
}
```

Removes all files in the bucket. If the call succeeds the `value` key will hold the string "ok". Backblaze B2 uses by default a form of versioning which can't be turned off, `clearBucket` automatically removes all existing versions of the file.

The `bucketName` arg is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will set to `"no bucket selected"`.

> Note: dependent on the type of storage and the credentials used, you may need extra access rights for this action.

<hr>

### deleteBucket

```typescript
deleteBucket(bucketName?: string): Promise<ResultObject>;
```

return type:

```typescript
export interface ResultObject {
  value: string | null;
  error: string | null;
}
```

Deletes the bucket and all files in it. If the call succeeds the `value` key will hold the string "ok". If the deleted bucket was the selected bucket, selected bucket will be set to `null`.

Does not fail if the bucket doesn't exist.

The `bucketName` arg is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will set to `"no bucket selected"`.

> Note: dependent on the type of storage and the credentials used, you may need extra access rights for this action.

<hr>

### addFile

```typescript
addFile(params: FilePathParams | FileStreamParams | FileBufferParams): Promise<ResultObject>;
```

A generic method that is called under the hood when you call `addFileFromPath`, `addFileFromStream` or `addFileFromBuffer`. It adds a file to a bucket and accepts the file in 3 different ways; as a path, a stream or a buffer, dependent on the type of `params`.

There is no difference between using this method or one of the 3 specific methods. For details about the `params` object and the return value see the documentation below.

<hr>

### addFileFromPath

```typescript
addFileFromPath(params: FilePathParams): Promise<ResultObject>;
```

param type:

```typescript
export type FilePathParams = {
  bucketName?: string;
  origPath: string;
  targetPath: string;
  options?: {
    [id: string]: any;
    ACL?: string; // for AdapterAmazonS3 i.c.w. Cubbit
  };
};
```

return type:

```typescript
export interface ResultObject {
  value: string | null;
  error: string | null;
}
```

Copies a file from a local path `origPath` to the provided path `targetPath` in the storage. The value for `targetPath` needs to include at least a file name. You can provide extra storage-specific settings such as access rights using the `options` object.

The key `bucketName` is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will hold `"no bucket selected"`.

If the call is successful `value` will hold the string "ok".

>[!NOTE]
> If you use the Amazon S3 adapter with Cubbit and you want the files stored in a public bucket to be public as well you need to add `{ACL: "public-read"}` or `{ACL: "public-read-write"}` to the options object.

<hr>

### addFileFromBuffer

```typescript
addFileFromBuffer(params: FileBufferParams): Promise<ResultObject>;
```

param type:

```typescript
export type FileBufferParams = {
  bucketName?: string;
  buffer: Buffer;
  targetPath: string;
  options?: {
    [id: string]: any;
    ACL?: string; // for AdapterAmazonS3 i.c.w. Cubbit
  };
};
```

return type:

```typescript
export interface ResultObject {
  value: string | null;
  error: string | null;
}
```

Copies a buffer to a file in the storage. The value for `targetPath` needs to include at least a file name. You can provide extra storage-specific settings such as access rights using the `options` object.

The key `bucketName` is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will hold `"no bucket selected"`.

If the call is successful `value` will hold the string "ok".

This method is particularly handy when you want to move uploaded files directly to the storage, for instance when you use Express.Multer with [MemoryStorage](https://github.com/expressjs/multer#memorystorage).

>[!NOTE]
> If you use the Amazon S3 adapter with Cubbit and you want the files stored in a public bucket to be public as well you need to add `{ACL: "public-read"}` or `{ACL: "public-read-write"}` to the options object.

<hr>

### addFileFromStream

```typescript
addFileFromStream(params: FileStreamParams): Promise<ResultObject>;
```

param type:

```typescript
export type FileStreamParams = {
  bucketName?: string;
  stream: Readable;
  targetPath: string;
  options?: {
    [id: string]: any;
    ACL?: string // for AdapterAmazonS3 i.c.w. Cubbit
  };
};
```

return type:

```typescript
export interface ResultObject {
  value: string | null;
  error: string | null;
}
```

Allows you to stream a file directly to the storage. The value for `targetPath` needs to include at least a file name. You can provide extra storage-specific settings such as access rights using the `options` object.

The key `bucketName` is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will set to `"no bucket selected"`.

If the call is successful `value` will hold the string "ok".

This method is particularly handy when you want to store files while they are being processed; for instance if a user has uploaded a full-size image and you want to store resized versions of this image in the storage; you can pipe the output stream of the resizing process directly to the storage.


>[!NOTE]
> If you use the Amazon S3 adapter with Cubbit and you want the files stored in a public bucket to be public as well you need to add `{ACL: "public-read"}` or `{ACL: "public-read-write"}` to the options object.

<hr>

### getPresignedUploadURL

```typescript
getPresignedUploadURL(  
  [bucketName: string, fileName: string, options?: Options] |
  [fileName: string, options?: Options]
): Promise<ResultObjectObject>;
```
Options:

```typescript
type Options = {
  expiresIn?: number,
  [id: string]: any,
}
```

return type:

```typescript
export interface ResultObject {
  value: { url: string, [id: string]: any, } | null;
  error: string | null;
}
```

Returns a presigned upload URL that you can use to upload a file without having to log in to the cloud storage service.

The key `bucketName` is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will set to `"no bucket selected"`.

The way presigned upload URLs are implemented in the various cloud storage services differs a lot. Below code examples for the supported services:

#### Amazon S3

```typescript
const r = await storage.getPresignedUploadURL("the-bucket", "test.jpg", {
  expiresIn: 3600, // seconds, default 300
  conditions: [
    ["starts-with", "$key", fileName], // only upload if the name of the uploaded file matches
    ["content-length-range", 1, 25 * 1024 * 1024], // limit upload to 25MB
    ["starts-with", "$Content-Type", "image/"], // only allow images
    { "x-amz-server-side-encryption": "AES256" },
    { "acl": "private" }, // if using ACLs
    ["starts-with", "$x-amz-meta-user", ""], // force certain metadata fields
  ],
  fields: [
    "x-amz-server-side-encryption": "AES256",
    acl: "bucket-owner-full-control",
  ] 
});

// Process the result in Node 18+ using Node native fetch and FormData:

const {value: {url, fields}} = r;
const form = new FormData();
const fileBuffer = fs.readFileSync("./tests/data/image1.jpg");

Object.entries((r.value as any).fields).forEach(([field, value]) => {
    form.append(field, value as string);
});
form.append("file", new Blob([fileBuffer]), fileName);

response = await fetch(url, {
    method: 'POST',
    body: form,
});

```

#### Azure Blob

```typescript
const r = await storage.getPresignedUploadURL("the-bucket", "test.jpg", {
  expiresIn: 3600, // seconds, default 300
  startsAt: -60, // seconds, default -60
  permissions: {
    add: true,
    create: true,
    write: true,
  }
});

// Process the result in Node 18+ using Node native fetch PUT:

const {value: {url}} = r;
const fileBuffer = fs.readFileSync("./tests/data/image1.jpg");

response = await fetch(url, {
    method: 'PUT',
    body: fileBuffer,
    headers: {
        'x-ms-blob-type': 'BlockBlob',
    }
});

```

#### Backblaze B2 (native API)

```typescript
const r = await storage.getPresignedUploadURL("the-bucket");

// Process the result in Node 18+ using Node native fetch POST:

const {value: {url, authToken}} = r;
const fileBuffer = fs.readFileSync("./tests/data/image1.jpg");

response = await fetch(url, {
    method: 'POST',
    body: fileBuffer,
    headers: {
        "Authorization": authToken,
        "X-Bz-File-Name": "test.jpg", 
        "Content-Type": "image/jpeg",
        "X-Bz-Content-Sha1": crypto.createHash("sha1").update(fileBuffer).digest("hex"),
        "X-Bz-Info-Author": "sab-test" // anything goes
    }
});

```
> [!NOTE] 
> You don't have to specify a filename and there are no options such as `expiresIn` available. The Backblaze B2 upload url is standard valid for 24 hours and this isn't customizable


#### Google Cloud Storage

```typescript
const r = await storage.getPresignedUploadURL("the-bucket", "test.jpg", {
  expiresIn: 3600,    // seconds, default 300
  version: "v4",    // either "v2" or "v4", defaults to "v4"
  action: "write",  // either "write", "read", "delete" or "resumable", defaults to "write"
  contentType: "application/octet-stream", // set content type to match your file type or use the default "application/octet-stream" that works in any case
});

// Process the result in Node 18+ using Node native fetch PUT:

const {value: {url}} = r;
const fileBuffer = fs.readFileSync("./tests/data/image1.jpg");

response = await fetch(url, {
    method: 'PUT',
    body: fileBuffer,
    headers: {
        "Content-Type": "application/octet-stream" // content type must match with the value specified above!
    }
});
```

#### Minio

```typescript
const r = await storage.getPresignedUploadURL("the-bucket", "test.jpg", {
  expiresIn: 3600,    // seconds, default 300
});

// Process the result in Node 18+ using Node native fetch PUT:

const {value: {url}} = r;
const fileBuffer = fs.readFileSync("./tests/data/image1.jpg");

response = await fetch(url, {
    method: 'PUT',
    body: fileBuffer,
    headers: {
        "Content-Type": "application/octet-stream"
    }
});
```

<hr>

### getPublicURL

```typescript
getPublicURL(...args:
  [bucketName: string, fileName: string, options?: Options] |
  [fileName: string, options?: Options]
): Promise<ResultObject>;

param type:

```typescript
type Options {
  [id: string]: any;
  noCheck?: boolean;
  withoutDirectory?: boolean; // only for the local adapter
}
```

return type:

```typescript
export type ResultObject = {
  value: string | null;
  error: string | null;
};
```

Returns the public url of the file. Returns an error if the bucket is not public. 

The `bucketName` arg is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will set to `"no bucket selected"`.

With the `noCheck` key in the options object set to `true` you can bypass the check if the bucket is actually public. Using this the method will always return a url. The bypass was put in place because there is no way to check if a bucket is public when you use Cubbit of Backblaze with the Amazon S3 SDK; you can only check this using the web console of Cubbit and Backblaze respectively. You should only use this bypass if you are sure the bucket is public otherwise the url returned will be unreachable.

The Amazon S3 SDK doesn't have a method to retrieve a public url, instead the url is composed of known data using a cloud service specific template:
- Amazon: `https://${bucket_name}.s3.${region}.amazon.com/${file_name}`
- Backblaze: `https://${bucket_name}.s3.${region}.backblazeb2.com/${file_name}`
- Cloudflare: N/A, see below
- Cubbit: `https://${bucket_name}.s3.cubbit.eu/${file_name}`

Although Cloudflare R2 is S3 compatible, this method cannot return a public url when you use R2 cloud storage. R2 only supports public buckets if you add a custom domain to your bucket, see [the documentation](https://developers.cloudflare.com/r2/buckets/public-buckets/#managed-public-buckets-through-r2dev) on the Cloudflare site. You can add a custom domain to your bucket in the Cloudflare Console and after that you can simply construct the url of the bucket in your own code. You could enable and use the Public Development URL but that is not meant to be used for production. Alternately, you could use a pre-signed url instead of a public url.

For the local adapter you can use the key `withoutDirectory` in the options object:

```typescript
const s = new Storage({
  type: Provider.LOCAL,
  directory: "./your_working_dir/sub_dir",
  bucketName: "bucketName",
});

const url1 = getPublicURL("bucketName", "fileName.jpg");
// your_working_dir/sub_dir/bucketName/fileName.jpg

const url2 = getPublicURL("bucketName", "fileName.jpg", { withoutDirectory: true });
// bucketName/fileName.jpg
```

<hr>

### getSignedURL

```typescript
getSignedURL(...args:
  [bucketName: string, fileName: string, options?: Options] |
  [fileName: string, options?: Options]
): Promise<ResultObject>;
```

param type:

```typescript
export Options {
  expiresIn: number // number of seconds the url is valid, defaults to a week (604800)
  [id: string]: any; 
}
```

return type:

```typescript
export type ResultObject = {
  value: string | null;
  error: string | null;
};
```

Returns a signed url of the file. 

The `bucketName` arg is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will set to `"no bucket selected"`.

Because the local adapter does not support signed urls, this method behaves exactly the same as `getPublicURL` when using the local adapter, see previous section.

> [!NOTE] 
> If you are connected to Azure using the password less option or with a SAS token you get an error: "Can only generate the SAS when the client is initialized with a shared key credential"
> Please use any of the other ways to login to Azure if you want to use this method.

<hr>

### getFileAsStream

```typescript
getFileAsStream(...args:
  [bucketName: string, fileName: string, options?: StreamOptions] |
  [fileName: string, options?: StreamOptions]
): Promise<ResultObjectStream>;
```

param type:

```typescript
export interface StreamOptions extends Options {
  start?: number;
  end?: number;
}
```

return type:

```typescript
export type ResultObjectStream = {
  value: Readable | null;
  error: string | null;
};
```

Returns a file in the storage as a readable stream. You can pass in extra options. If you use the keys `start` and/or `end` only the bytes between `start` and `end` of the file will be returned.

The `bucketName` arg is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will set to `"no bucket selected"`.

Some examples:

```typescript
getFileAsReadable("bucket-name", "image.png"); // &rarr; reads whole file

getFileAsReadable("bucket-name", "image.png", {}); // &rarr; reads whole file

getFileAsReadable("bucket-name", "image.png", { start: 0 }); // &rarr; reads whole file

getFileAsReadable("bucket-name", "image.png", { start: 0, end: 1999 }); // &rarr; reads first 2000 bytes

getFileAsReadable("bucket-name", "image.png", { end: 1999 }); // &rarr; reads first 2000 bytes

getFileAsReadable("bucket-name", "image.png", { start: 2000 }); // &rarr; reads file from byte 2000
```

<hr>

### removeFile

```typescript
removeFile(...args:
  [bucketName: string, fileName: string] |
  [fileName: string, options?: Options]
): Promise<ResultObject>;
```

return type:

```typescript
export interface ResultObject {
  error: string | null;
  value: string | null;
}
```

Removes a file from the bucket. Does not fail if the file doesn't exist.

The `bucketName` arg is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will set to `"no bucket selected"`.

If the bucket can not be found an error will be returned: `No bucket ${bucketname} found`. 

If the call succeeds the `value` key will hold the string "ok".

If the file can not be found `value` will be: `No file ${filename} found in bucket ${bucketname}`. 

<hr>

### sizeOf

```typescript
sizeOf(...args:
  [bucketName: string, fileName: string] |
  [fileName: string]
): Promise<ResultObjectNumber>;
```

return type:

```typescript
export type ResultObjectNumber = {
  error: string | null;
  value: number | null;
};
```

Returns the size of a file.

The `bucketName` arg is optional; if you don't pass a value the selected bucket will be used. The selected bucket is the bucket that you've passed with the config upon instantiation or that you've set afterwards using `setSelectedBucket`. If no bucket is selected the value of the `error` key in the result object will set to `"no bucket selected"`.

If the call succeeds the `value` key will hold the size of the file.

## Storage API

The Storage class has two extra method besides all methods of the `IAdapter` interface.

### <a name='getadapter'></a>getAdapter

```typescript
getAdapter(): IAdapter;

// also implemented as getter
const s = new Storage({type: Provider.S3})
const a = s.adapter;
```

Returns the instance of the Adapter class that this Storage instance is currently using to access a storage service.

<hr>

### <a name='switchadapter'></a>switchAdapter

```typescript
switchAdapter(config: string | AdapterConfig): void;
```

This method is used to instantiate the right adapter when you create a Storage instance. The method can also be used to switch to another adapter in an existing Storage instance at runtime.

The config parameter is the same type of object or URL that you use to instantiate a Storage. This method can be handy if your application needs a view on multiple storages.

If your application needs to copy over files from one storage service to another, say for instance from Google Cloud to Amazon S3, then it is more convenient to create 2 separate Storage instances:

```typescript
import { Storage } from "@tweedegolf/storage-abstraction"

const s1 = new Storage({type: "s3"});
const s2 = new Storage({type: "gcs"});

s2.addFile({
  bucketName: "bucketOnGoogleCloud"
  stream: s1.getFileAsStream("bucketOnAmazon", "some-image.png"),
  targetPath: "copy-of-some-image.png",
})

```

## Adding an adapter

It is relatively easy to add an adapter for an unsupported cloud service. Note however that many cloud storage services are compatible with Amazon S3 so if that is the case, please check first if the Amazon S3 adapter does the job; it might work right away. However, sometimes even if a storage service is S3 compatible you have to write a separate adapter. For instance: although MinIO is S3 compliant it was necessary to write a separate adapter for MinIO.

If you want to add an adapter you can choose to make your adapter a class or a function; so if you don't like OOP you can implement your adapter using FP or any other coding style or programming paradigm you like.

Your adapter might have additional dependencies such as a service client library, like for instance the aws-sdk as is used in the Amazon S3 adapter. Add these dependencies to the package.json file in the `./publish/YourAdapter` folder.

You may want to add your Adapter code to this package, in that case please add your dependencies to the package.json file in the root folder of the Storage Abstraction package as well. Your dependencies will not be added to the Storage Abstraction package when published to npm because only the files in the publish folder are published and there is a stripped version of the package.json file in the `./publish/Storage` folder.

You may also want to add some tests for your adapter and it would be very much appreciated if you could publish your adapter to npm and add your adapter to this README, see [this table](#adapters).

Follow these steps:

1. Add a new type to the `Provider` enum in `./src/types/general.ts`
2. Define a configuration object (and a configuration url if you like)
3. Write your adapter, make sure it implements all API methods
4. Register your adapter in `./src/adapters.ts`
5. Publish your adapter on npm.
6. You may also want to add the newly supported cloud storage provider to the keywords array in the package.json file of the Storage Abstraction storage (note: there 2 package.json file for this package, one in the root folder and another in the publish folder)

### Add your storage type

You should add the name of the your type to the enum `Provider` in `./src/types/general.ts`. It is not mandatory but may be very handy.

```typescript
// add your type to the enum
export enum Provider {
  LOCAL = "local",
  GCS = "gcs",      // Google Cloud Storage
  S3 = "s3",        // Amazon S3
  B2 = "b2",        // BackBlaze B2
  AZURE = "azure",  // Microsoft Azure Blob
  MINIO = "minio",
  ...
  YOUR_PROVIDER = "your-provider",
}
```

### Define your configuration

A configuration object type should at least contain a key `provider`. To enforce this the Storage class expects the config object to be of type `StorageAdapterConfig`:

```typescript
export interface AdapterConfig {
  bucketName?: string;
  [id: string]: any; // eslint-disable-line
}

export interface StorageAdapterConfig extends AdapterConfig {
  provider: Provider;
}
```

For your custom configuration object you can either choose to extend `StorageAdapterConfig` or `AdapterConfig`. If you choose the latter you can use your adapter standalone without having to specify a redundant key `provider`, which is why the configuration object of all existing adapters extend `AdapterConfig`.

```typescript
export interface YourAdapterConfig extends AdapterConfig {
  additionalKey: string,
  ...
}

const s = new Storage({
  provider: Provider.YOUR_PROVIDER, // mandatory for Storage
  key1: string, // other mandatory or optional key that your adapter need for instantiation
  key2: string,
}) // works!

const a = new YourAdapter({
  key1: string,
  key2: string,

}) // works because provider is not mandatory
```

Also your configuration URL should at least contain the provider. The name of the provider is used for the protocol part of the URL. Upon instantiation the Storage class checks if a protocol is present on the provided URL.

example:

```typescript
// your configuration URL
const u = "your-provider://user:pass@bucket_name?option1=value1&...";
```

You can format the configuration URL completely as you like as long as your adapter has an appropriate function to parse it into the configuration object that your adapter expects. If your url follows the standard URL format you don't need to write a parse function, you can import the `parseUrl` function from `./src/util.ts`.

For more information about configuration URLs please read [this section](#configuration-url)

### Adapter class

It is recommended that your adapter class extends `AbstractStorage`. If you look at the [code](https://github.com/tweedegolf/storage-abstraction/blob/master/src/AbstractAdapter.ts) you can see that it implements the complete introspective API. `getServiceClient` returns an `any` value and `getConfig` returns a generic `AdapterConfig` object; you may want to override these methods to make them return your adapter specific types.

Note that all API methods that have and optional `bucketName` arg are implemented as overloaded methods:

- `clearBucket`
- `deleteBucket`
- `bucketExists`
- `bucketIsPublic`
- `getPublicURL`
- `getSignedURL`
- `getFileAsStream`
- `fileExists`
- `removeFile`
- `listFiles`
- `sizeof`

The implementation of these methods in the AbstractAdapter handles the overloading part and performs some general checks that apply to all adapters. Then they call the cloud specific protected 'tandem' function that handles the adapter specific logic. The tandem function has the same name with an underscore prefix.

For instance: the implementation of `clearBucket` in AbstractAdapter checks for a `bucketName` arg and if it is not provided it looks if there is a selected bucket set. It also checks for configuration errors. Then it calls `_clearBucket` which should be implemented in your adapter code to handle your cloud storage specific logic. This saves you a lot of hassle and code in your adapter module.

One other thing to note is the way `addFileFromPath`, `addFileFromBuffer` and `addFileFromReadable` are implemented; these are all forwarded to the API function `addFile`. This function stores files in the storage using 3 different types of origin; a path, a buffer and a stream. Because these ways of storing have a lot in common they are grouped together in a single method.

If you look at `addFile` you see that just like the overloaded methods mentioned above, the implementation handles some generic logic and then calls `_addFile` in your adapter code.

The abstract stub methods need to be implemented and the other `IAdapter` methods can be overridden in the your adapter class if necessary. Note that your adapter should not implement the methods `getAdapter` and `switchAdapter`; these are part of the Storage API.

You don't necessarily have to extend `AbstractAdapter` but if you choose not to your class should implement the `IAdapter` interface. You'll find some configuration parse functions in the separate file `./src/util.ts` so you can easily import these in your own class if these are useful for you.

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

If you want to run the tests you have to checkout the repository from github and install all dependencies with `npm install` or `yarn install`. There are tests for all storage types; note that you may need to add your credentials to a `.env` file, see the file `.env.default` and `config_urls.md` for more explanation, or provide credentials in another way. Also it should be noted that some of these tests require that the credentials allow to create, delete and list buckets.

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
npm run test-cubbit
# or
npm run test-jasmine 6

# test Cloudflare R2
npm run test-cloudflare
# or
npm run test-jasmine 7

# test Backblaze B2 S3 API
npm run test-b2-s3
# or
npm run test-jasmine 8
```

As you can see in the file `package.json`, the command sets the `type` environment variable which is then read by Jasmine.

To run all Jasmine tests consecutively:

```bash
npm run test-all
```

You can find some additional non-Jasmine tests in the file `tests/test_runs.ts`. Every test is a functions that makes a series of API calls to test certain functionality in isolation. A the bottom of this file you'll find the `run` function where you can comment out the  you don't want to run.

You can find the API calls in the file `tests/api_calls.ts`. Every API call is declared in a function with the same name as the API method it is calling, some additional functionality like logging and checking the result is added to the function.

You can select the type of storage by passing a commandline parameter:
| command | storage
| --- | --- |
| `npm test 0` | Local|
| `npm test 1` | Amazon S3|
| `npm test 2` | Backblaze B2|
| `npm test 3` | Google Cloud Storage|
| `npm test 4` | Azure Blob Storage|
| `npm test 5` | Minio|
| `npm test 6` | Cubbit (S3 compatible)|
| `npm test 7` | Cloudflare R2 (S3 compatible)|
| `npm test 8` | Backblaze B2 (S3 compatible)|

Note that the test `testPublicBucket` tries to create a public bucket. However creating a public bucket on Cloudflare R2 and on Backblaze B2 when using the S3 adapter is not possible; even if you add `{public: true}` the created bucket  `sab-test-public` will be private.

You can make the created bucket public using the web console of Cloudflare and Backblaze. You can also create a public bucket `sab-test-public` before you run the test.

## Example application

> [!NOTE]
> not yet updated to API 2.0!

A simple application that shows how you can use the storage abstraction package can be found in [this repository](https://github.com/tweedegolf/storage-abstraction-example). It uses and Ts.ED and TypeORM and it consists of both a backend and a frontend.

## Questions and requests

Please let us know if you have any questions and/or request by creating an [issue](https://github.com/tweedegolf/storage-abstraction/issues).

```

```
