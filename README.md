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

## <a name='table-of-contents'></a>Table of contents

<!-- toc -->

- [Instantiate a storage](#instantiate-a-storage)
  - [Configuration object](#configuration-object)
  - [Configuration URL](#configuration-url)
  - [Mandatory and optional keys per service](#mandatory-and-optional-keys-per-service)
    - [Local Storage](#local-storage)
    - [Amazon S3 and compatible](#amazon-s3-and-compatible)
    - [Google Cloud Storage](#google-cloud-storage)
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
  - [addFileFromPath](#addfilefrompath)
  - [addFileFromBuffer](#addfilefrombuffer)
  - [addFileFromReadable](#addfilefromreadable)
  - [addFile](#addfile)
  - [getFileAsStream](#getfileasstream)
  - [removeFile](#removefile)
  - [sizeOf](#sizeof)
  - [bucketExists](#bucketexists)
  - [fileExists](#fileexists)
  - [listFiles](#listfiles)
  - [getType](#gettype)
  - [getConfiguration](#getconfiguration)
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

## <a name='instantiate-a-storage'></a>Instantiate a storage

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

### <a name='configuration-object'></a>Configuration object

A configuration object type that extends `AdapterConfig`:

```typescript
interface AdapterConfig {
  type: string;
  bucketName?: string;
  [id: string]: any; // other service specific mandatory or optional keys
}
```

Besides the mandatory key `type` one or more keys may be mandatory or optional dependent on the type of storage; for instance keys for passing credentials such as `keyFilename` for Google Storage or `accessKeyId` and `secretAccessKey` for Amazon S3, and keys for further configuring the storage service such as `StoragePipelineOptions` for Azure Blob.

### <a name='configuration-url'></a>Configuration URL

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

#### Google Cloud Storage

```typescript
export interface AdapterConfigGoogle extends AdapterConfig {
  keyFilename?: string;
}

const url = "gcs://keyFilename=path/to/keyFile.json";
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

#### Backblaze B2

```typescript
export interface AdapterConfigB2 extends AdapterConfig {
  applicationKey: string;
  applicationKeyId: string;
}

const url = "b2://applicationKeyId=your-key-id&applicationKey=your-key";
```

#### Azure Blob Storage

```typescript
export interface AdapterConfigAzure extends AdapterConfig {
  accountName?: string;
  connectionString?: string;
  accountKey?: string;
  sasToken?: string;
}

const url = "azure://accountName=your-account";
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

Note that if you don't use the `accountKey` and you add files to a bucket you will get this error message:

`'Can only generate the SAS when the client is initialized with a shared key credential'`

This does not mean that the file hasn't been uploaded, it simply means that no public url has been generated for this file.

## <a name='adapters'></a>Adapters

The adapters are the key part of this library; where the `Storage` is merely a thin wrapper (see [How it works](#how-it-works)), adapters perform the actual actions on the storage by translating generic API methods calls to storage specific calls.

Below follows a description of the available adapters; what the configuration objects and URLs look like and what the default values are. Also per adapter the peer dependencies are listed as a handy copy-pasteble npm command. The peer dependencies are usually wrapper libraries such as aws-sdk but can also be specific modules with a specific functionality such as rimraf for local storage.

If you want to use one or more of the adapters in your project make sure you install the required peer dependencies. By installing only the dependencies that you will actually use, your project codebase will stay as slim and maintainable as possible.

You can also add more adapters yourself very easily, see [below](#adding-more-adapters)

### <a name='local-storage'></a>Local storage

> peer dependencies: <br/> > `npm i glob rimraf`

Configuration object:

```typescript
export interface AdapterConfigLocal extends AdapterConfig {
  directory: string;
  mode?: number;
}
```

Configuration url:

```typescript
const url = "local://directory=path/to/directory&mode=750";
```

With the optional key `mode` you can set the access rights when you create new local buckets. The default value is `0o777`, note that the actual value is dependent on the umask settings on your system (Linux and MacOS only). You can pass this value both in decimal and in octal format. E.g. `rwxrwxrwx` is `0o777` in octal format or `511` in decimal format.

When you use a configuration URL you can only pass values as strings. String values without radix prefix will be interpreted as decimal numbers, so "777" is _not_ the same as "0o777" and yields `41411`. This is probably not what you want. The configuration parser handles this by returning the default value in case you pass a value over decimal `511`.

Example:

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

### <a name='google-cloud'></a>Google Cloud

> peer dependencies: <br/> > `npm i @google-cloud/storage ramda`

Configuration object:

```typescript
type ConfigGoogleCloud = {
  type: StorageType;
  keyFilename?: string; // path to keyFile.json
  projectId?: string;
  bucketName?: string;
  [id: string]: boolean | string | number; // configuration is extensible
};
```

Configuration url:

```typescript
const url = "gcs://path/to/keyFile.json:projectId@bucketName";
```

The key filename is optional; if you omit the value for key filename, application default credentials with be loaded:

```typescript
const s = new Storage({
  type: StorageType.GCS,
});

const s = new Storage("gcs://bucketName");
```

The project id is optional; if you omit the value for project id, the id will be read from the key file or by the application default credentials:

```typescript
const s = new Storage({
  type: StorageType.GCS,
  keyFilename: "path/to/keyFile.json",
});

const s = new Storage("gcs://path/to/keyFile.json");
```

The project id is required if the key file is type `.pem` or `.p12`:

```typescript
const s = new Storage({
  type: StorageType.GCS,
  keyFilename: "path/to/keyFile.pem",
  projectId: "projectId",
});

const s = new Storage("gcs://path/to/keyFile.pem:projectId");
```

Another example:

```typescript
// example #1
const s = new Storage({
  type: StorageType.GCS,
  keyFilename: "path/to/keyFile.json",
  bucketName: "bucket",
});

const s = new Storage("gcs://path/to/keyFile.json@bucket");
```

### <a name='amazon-s3'></a>Amazon S3

> peer dependencies: <br/> > `npm i aws-sdk`

Configuration object:

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

Configuration url:

```typescript
// Cubbit S3 compatible
const url =
  "s3://accessKeyId=your-key-id&secretAccessKey=your-access-key&endpoint=https://s3.cubbit.eu/&region=auto";
```

In AWS's SDK, it is possible to skip the passing in of the `accessKeyId` and `secretAccessKey`; the AWS SDK will automatically read it from a chain of providers, e.g. from environment variables or the ECS task role, so this will work:

```typescript
const s = new Storage({ type: StorageType.S3 });
// with a config url:
const s = new Storage("s3://");
// and even:
const s = new Storage("s3");
```

Environment variables that are automatically read:

```shell
AWS_ACCESS_KEY_ID="your access key"
AWS_SECRET_ACCESS_KEY="your secret"
AWS_REGION="eu-west-1"

```

Note that this does _not_ work for S3 compatible services because the AWS SDK doesn't read the endpoint from environment variables.

Also, if you pass a value for `endpoint` in the config, for some reason AWS SDK does read the environment variable `AWS_REGION` `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

So for S3 compatible services setting a value for `endpoint`, `accessKeyId` and `secretAccessKey` in the config is mandatory.

For S3 compatible services `region` is mandatory as well but you don't have to pass this in the config because AWS SDK does always read the `AWS_REGION` environment variable. Note that the names of the regions may differ from service to service.

#### <a name='s3-compatible-storage'></a>S3 Compatible Storage

Cloudflare R2, Backblaze B2 and Cubbit are S3 compatible services. You can use the `AdapterAmazonS3` but you have to add a value for `endpoint` in the config

#### Cloudflare R2

```typescript
const configR2 = {
  type: StorageType.S3,
  region: 'auto'
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY,
  secretAccessKey: process.env.R2_SECRET_KEY,
};
```

The endpoint is `https://<ACCOUNT_ID>.<JURISDICTION>.r2.cloudflarestorage.com`.

Jurisdiction is optional, e.g. `eu`.

It is mandatory to set a value for `region`, use one of these:

- `auto`
- `wnam`
- `enam`
- `weur`
- `eeur`
- `apac`

You can also set the region using the `AWS_REGION` environment variable.

#### Backblaze S3

```typescript
const configBackblazeS3 = {
  type: StorageType.S3,
  endpoint: process.env.B2_ENDPOINT,
  accessKeyId: process.env.B2_APPLICATION_KEY_ID,
  secretAccessKey: process.env.B2_APPLICATION_KEY,
};
```

The endpoint is `https://s3.<REGION>.backblazeb2.com`. Although the region is part of the endpoint AWS SDK still expects you to set a value for `region` in the configuration. As just stated, you can simply retrieve your region from the endpoint.

Backblaze also has a native API, see below.

### <a name='backblaze-b2'></a>Backblaze B2

Config object:

```typescript
type ConfigBackBlazeB2 = {
  type: StorageType;
  applicationKey: string;
  applicationKeyId: string;
  bucketName?: string;
  [id: string]: boolean | string | number; // configuration is extensible
};
```

Configuration url:

```typescript
const url = "b2://applicationKeyId=keyId&applicationKey=key&bucketName=the-buck";
```

Example:

```typescript
const s = new Storage({
  type: StorageType.B2,
  applicationKey: "key",
  applicationKeyId: "keyId",
  bucketName: "bucket",
});

const s = new Storage("b2://keyId:key@bucket");
```

createBucket => options can not be an empty object

### <a name='azure-blob'></a>Azure Blob Storage

> peer dependencies: <br/> > `npm i @azure/storage-blob`

Config object:

```typescript
type ConfigAzureStorageBlob = {
  type: StorageType;
  storageAccount: string;
  accessKey: string;
  bucketName?: string;
};
```

Configuration url:

```typescript
const url = "azure://account:accessKey@containerName";
```

Example:

```typescript
const s = new Storage({
  type: StorageType.AZURESTORAGEBLOB,
  storageAccount: "storage1",
  accessKey: "accessKey1",
  bucketName?: "container1",
});

const s = new Storage("azure://storage1:accessKey1@container1");
```

## <a name='api-methods'></a>API methods

### <a name='createbucket'></a>createBucket

```typescript
createBucket(name: string, options?: object): Promise<ResponseObject>;
```

Creates a new bucket. If the bucket was created successfully it resolves to "ok". If the bucket exists or the creating the bucket fails for another reason it resolves to an error message. You can provide extra storage-specific settings such as access rights using the `options` object.

> Note: dependent on the type of storage and the credentials used, you may need extra access rights for this action. E.g.: sometimes a user may only access the contents of one single bucket.

### <a name='clearbucket'></a>clearBucket

```typescript
clearBucket(name: string): Promise<ResponseObject>;
```

Removes all files in the bucket.

> Note: dependent on the type of storage and the credentials used, you may need extra access rights for this action.

### <a name='deletebucket'></a>deleteBucket

```typescript
deleteBucket(name: string): Promise<ResponseObject>;
```

Deletes the bucket and all files in it.

> Note: dependent on the type of storage and the credentials used, you may need extra access rights for this action.

### <a name='listbuckets'></a>listBuckets

```typescript
listBuckets(): Promise<ResponseObjectBuckets>
```

Returns an array with the names of all buckets in the storage.

> Note: dependent on the type of storage and the credentials used, you may need extra access rights for this action. E.g.: sometimes a user may only access the contents of one single bucket.

### <a name='addfilefrompath'></a>addFileFromPath

```typescript
addFileFromPath({filePath: string, targetPath: string, options?: object}: FilePathParams): Promise<ResultObject>;
```

Copies a file from a local path to the provided path in the storage. The value for `targetPath` needs to include at least a file name. You can provide extra storage-specific settings such as access rights using the `options` object. Returns the public url to the file (if the bucket is publicly accessible).

### <a name='addfilefrombuffer'></a>addFileFromBuffer

```typescript
addFileFromBuffer({buffer: Buffer, targetPath: string, options?: object}: FileBufferParams): Promise<ResultObject>;
```

Copies a buffer to a file in the storage. The value for `targetPath` needs to include at least a file name. You can provide extra storage-specific settings such as access rights using the `options` object. This method is particularly handy when you want to move uploaded files to the storage, for instance when you use Express.Multer with [MemoryStorage](https://github.com/expressjs/multer#memorystorage). Returns the public url to the file.

### <a name='addfilefromreadable'></a>addFileFromReadable

```typescript
addFileFromReadable({stream: Readable, targetPath: string, options?: object}: FileStreamParams): Promise<ResultObject>;
```

Allows you to stream a file directly to the storage. The value for `targetPath` needs to include at least a file name. You can provide extra storage-specific settings such as access rights using the `options` object. This method is particularly handy when you want to store files while they are being processed; for instance if a user has uploaded a full-size image and you want to store resized versions of this image in the storage; you can pipe the output stream of the resizing process directly to the storage. Returns the public url to the file.

### <a name='addfile'></a>addFile

```typescript
addFile(params: FilePathParams | FileBufferParams | FileStreamParams): Promise<ResultObject>;
```

Generic method for adding a file to the storage; this method is actually called if you use one of the three aforementioned methods.

### <a name='getfileasstream'></a>getFileAsStream

```typescript
getFileAsStream(bucketName: string, fileName: string, options?: {start?: number, end?: number}): Promise<ResultObjectStream>;
```

Returns a file in the storage as a readable stream. You can specify a byte range by using the extra range argument, see these examples:

```typescript
getFileAsReadable("bucket-name", "image.png"); // &rarr; reads whole file

getFileAsReadable("bucket-name", "image.png", {}); // &rarr; reads whole file

getFileAsReadable("bucket-name", "image.png", { start: 0 }); // &rarr; reads whole file

getFileAsReadable("bucket-name", "image.png", { start: 0, end: 1999 }); // &rarr; reads first 2000 bytes

getFileAsReadable("bucket-name", "image.png", { end: 1999 }); // &rarr; reads first 2000 bytes

getFileAsReadable("bucket-name", "image.png", { start: 2000 }); // &rarr; reads file from byte 2000
```

### <a name='removefile'></a>removeFile

```typescript
removeFile(bucketName: string, fileName: string, allVersions: boolean = false): Promise<ResultObject>;
```

Removes a file from the bucket. Does not fail if the file doesn't exist.

Returns "ok" or "file not found".

### <a name='sizeof'></a>sizeOf

```typescript
sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber>;
```

Returns the size of a file.

### <a name='bucketexists'></a>bucketExists

```typescript
bucketExists(name: string): Promise<ResultObjectBoolean>;
```

Returns whether a bucket exists or not.

### <a name='fileexists'></a>fileExists

```typescript
fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>;
```

Returns whether a file exists or not.

### <a name='listfiles'></a>listFiles

```typescript
listFiles(bucketName: string): Promise<ResultObjectFiles>;
```

Returns a list of all files in the bucket; for each file a tuple is returned containing the path and the size of the file.

### <a name='gettype'></a>getType

```typescript
getType(): string;
```

Returns the type of storage, value is one of the enum `StorageType`.

### <a name='getconfiguration'></a>getConfiguration

```typescript
getConfiguration(): AdapterConfig

// also implemented as getter:

const storage = new Storage(config);
console.log(storage.conf)
```

Retrieves the configuration as provided during instantiation. If you have provided the configuration in url form, the function will return it as an configuration object.

### <a name='switchadapter'></a>switchAdapter

```typescript
switchAdapter(config: string | AdapterConfig): void;
```

Switch to another adapter in an existing `Storage` instance at runtime. The config parameter is the same type of object or URL that you use to instantiate a storage. This method can be handy if your application needs a view on multiple storages. If your application needs to copy over files from one storage to another, say for instance from Google Cloud to Amazon S3, then it is more convenient to create 2 separate `Storage` instances. This method is also called by the constructor to instantiate the initial storage type.

## <a name='how-it-works'></a>How it works

A `Storage` instance is actually a thin wrapper around one of the available adapters; it creates an instance of an adapter based on the configuration object or URL that you provide. Then all API calls to the `Storage` are forwarded to this adapter instance, below a code snippet of the `Storage` class that shows how `createBucket` is forwarded:

```typescript
// member function of class Storage
async createBucket(name: string): Promise<ResultObject> {
  return this.adapter.createBucket(name);
};
```

The class `Storage` implements the interface `IStorage` and this interface declares the complete API. Because all adapters have to implement this interface as well, either by extending `AbstractAdapter` or otherwise, all API calls on `Storage` can be directly forwarded to the adapters.

The adapter subsequently takes care of translating the generic API to storage specific functions. Therefor, dependent on what definitions you use, this library could be seen as a wrapper or a shim.

The method `switchAdapter` is not declared in `IStorage` but in the `Storage` class itself; this is because the adapter have to implement `IStorage` and an adapter cannot (and should not) switch itself into another adapter

`switchAdapter` parses the configuration and creates the appropriate adapter instance. This is done by a lookup table that maps a storage type to a path to an adapter module; the module will be loaded in runtime using `require()`.

More adapter classes can be added for different storage types, note however that there are many cloud storage providers that keep their API compliant with Amazon S3, for instance [Wasabi](https://wasabi.com/).

## <a name='adding-more-adapters'></a>Adding more adapters

If you want to add an adapter you can choose to make your adapter a class or a function; so if you don't like OOP you can implement your adapter using FP or any other coding style or programming paradigm you like.

Your adapter might use a wrapper library for the storage type that you create the adapter for, like for instance aws-sdk is used in the Amazon S3 adapter. Add these dependencies to the peer dependencies in the package.json file in the `./publish` folder

This way your extra dependencies will not be installed automatically but have to be installed manually if the user actually uses your adapter in their code.

Please add an npm command to your documentation that users can copy paste to their terminal, e.g. `npm i storage-wrapper additional-module`.

And for library developers you can add your dependencies to the dependencies in the package.json file in the root directory as well because only the files in the publish folder are published to npm.

### <a name='define-your-configuration'></a>Define your configuration

Your configuration object should at least contain a key `type` and its value should be one of the values of the enum `StorageType`. You could accomplish this by extending the interface `IConfig`:

```typescript
interface IConfig {
  type: StorageType;
}
```

Your configuration URL should also at least contain the type; the name of the type is used for the protocol part of the URL. This name should be added to the enum `StorageType`.

```typescript
// add your type to the enum
enum StorageType {
  LOCAL = "local",
  GCS = "gcs", // Google Cloud Storage
  S3 = "s3", // Amazon S3
  B2 = "b2", // BackBlaze B2
  AZURE = "azure", // Microsoft Azure Blob
  MINIO = 'minio",
  YOUR_TYPE = "yourtype",
}
// your configuration URL
const u = "yourtype://and/the:rest@anything/goes?option1=value1&option2=value2...";

// your configuration object
const o = {
  type: "yourtype", // mandatory
  ...
}
```

You can format the configuration URL completely as you like as long as your adapter has an appropriate parsing function. If your url fit in the template `type://part1:part2@part3/bucketName?option1=value1&option2=value2...` you can use the `parseURL` function in `./util.ts`.

### <a name='adapter-class'></a>Adapter class

You could choose to let your adapter class extend the class `AbstractStorage`. If you look at the [code](https://github.com/tweedegolf/storage-abstraction/blob/master/src/AbstractAdapter.ts) you can see that it only implements small parts of the API such as the `getType` method. Also it performs some sanity checking of parameters of a few API functions; this way you don't have to implement these checks in all derived classes.

One thing to note is the way `addFileFromPath`, `addFileFromBuffer` and `addFileFromReadable` are implemented; these are all forwarded to the non-API function `store`. This function stores files in the storage using 3 different types of origin; a path, a buffer and a stream. Because these ways of storing have a lot in common they are grouped together in a single overloaded method.

For the rest it contains stub methods that need to be overruled or extended by the adapter subclasses.

You don't necessarily have to extend `AbstractAdapter` but if you choose not to your class should implement the `IStorage` interface. Most handy utility functions that are used in `AbstractAdapter` are defined in the file `./src/util.ts` so you can easily import them in your own class as well.

You can use this [template](https://github.com/tweedegolf/storage-abstraction/blob/master/src/template_class.ts) as a starting point for your adapter. The template contains a lot of additional documentation per method.

### <a name='adapter-function'></a>Adapter function

The only requirement for this type of adapter is that your module exports a function `createAdapter` that takes a configuration object or URL as parameter and returns an object that has the shape of the interface `IStorage`.

If you like, you can use the utility functions defined in `./src/util.js`. Also there is a [template](https://github.com/tweedegolf/storage-abstraction/blob/master/src/template_functional.ts) file that you can use as a starting point for your module.

### <a name='register-your-adapter'></a>Register your adapter

After you've finished your adapter module you need to register it, this requires 3 simple steps:

1] As mentioned earlier the adapters are loaded at runtime, therefor you have to add your type and the path to your module to the lookup table at the top of the file [`./src/Storage.ts`](https://github.com/tweedegolf/storage-abstraction/blob/master/src/Storage.ts#L5).

2] Add your type to the enum `StorageTypes` in `./src/types.ts`.

3] Also in the file `./src/types.ts` add your configuration type that extends `IAdapterConfig` and add it to the union type `AdapterConfig` as well.

## <a name='tests'></a>Tests

If you want to run the tests you have to checkout the repository from github and install all dependencies with `npm install` or `yarn install`. There are tests for all storage types; note that you may need to add your credentials to a `.env` file, see the file `.env.default` for more explanation, or provide credentials in another way. Also it should be noted that these tests require that the credentials allow to create, delete and list buckets.

You can run tests per storage type using one of these commands, see also the file `package.json`:

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

To run a generic Jasmine test that uses local storage and does not require any credentials use this command:

`npm run test-jasmine`

There are also Jamine tests that test a set of configuration objects and URLs per storage type:

```bash
# test config local disk
npm run test-config-local
# test config Google Cloud Storage
npm run test-config-gcs
# test config Amazon S3
npm run test-config-s3
# test config Backblaze B2
npm run test-config-b2
```

To run all tests:

```bash
npm run test-all
```

You can find some additional non-Jasmine tests in the file `tests/test.ts`. You can test a single type of storage or run all tests, just open the file and uncomment you want to run and:

`npm test`

## <a name='example-application'></a>Example application

A simple application that shows how you can use the storage abstraction package can be found in [this repository](https://github.com/tweedegolf/storage-abstraction-example). It uses and Ts.ED and TypeORM and it consists of both a backend and a frontend.

## <a name='questions-and-requests'></a>Questions and requests

Please let us know if you have any questions and/or request by creating an [issue](https://github.com/tweedegolf/storage-abstraction/issues).
