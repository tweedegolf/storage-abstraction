# Storage Abstraction

Provides an abstraction layer for interacting with a storage; this storage can be a local file system or a cloud storage. Currently local disk storage, Backblaze B2, Google Cloud and Amazon S3 and compliant cloud services are supported.

Because the API only provides basic storage operations (see [below](#api)) the API is cloud agnostic. This means for instance that you can develop your application using storage on local disk and then use Google Cloud or Amazon S3 in your production environment without changing any code.

## Instantiate a storage

```javascript
const s = new Storage(config);
```

When instantiating a new `Storage` the argument `config` is used to create an adapter that translates the generic API calls to storage specific calls. You can provide the `config` argument in 2 forms:

1. using a configuration object (js: `typeof === "object"` ts: `AdapterConfig`)
2. using a configuration URL (`typeof === "string"`)

A configuration should specify a type whose value is one of the enum members of `StorageType`:

```typescript
enum StorageType {
  LOCAL = "local",
  GCS = "gcs",
  S3 = "s3",
  B2 = "b2",
}
```

Besides type one or more other values may be mandatory dependent on the type of storage, e.g. `keyFilename` for Google Storage or `secretAccessKey` for Amazon S3.

### Configuration object

The configuration object should implement the interface `IConfig`:

```typescript
interface IConfig {
  type: StorageType;
  bucketName?: string;
  options?: JSON;
}
```

### Configuration URL

Configuration urls always start with a protocol that defines the storage type:

- `local://` &rarr; local storage
- `gcs://` &rarr; Google Cloud
- `s3://` &rarr; Amazon S3
- `b2://` &rarr; Backblaze B2

What follows after this protocol is the part that contains the configuration of the storage:

```typescript
const url = "type://part1:part2?bucketName=bucket&extraOption1=value1&extraOption2=value2";
```

### Options

Both the configuration object and the configuration URL can contain an unlimited amount of optional configuration parameters using the `options` key in a configuration object or extending the query string of a configuration URL. During initialization the options will be parsed into an internal `options` object that you can check using `getOptions()`.

Note that `bucketName` is part of the query string when using a configuration URL, but has its own key in a configuration object. To make sure the `options` object is the same in both ways of providing a configuration, the key `bucketName` gets stripped off the `options` object during initialization and is then added to the internal `configuration` object that you can check using `getConfiguration()`.

Options are not checked, which means non-existent keys or invalid values are not filtered and removed; it is the programmer's responsibility to provide correct keys and values:

```typescript
// url
const s1 = new Storage({
  type: StorageTypes.S3,
  accessKeyId: 'your_key_id,
  secretAccessKey: 'your_secret',
  options: {
    endPoint: "https://kms-fips.us-west-2.amazonaws.com", // should be 'endpoint'
    useDualStack: 42, // should be a boolean value
  }
});

```

### Default options

Every adapter can define its own default options; these will be overruled or extended by the options provided in the configuration object or URL.
All adapters have a default parameter `slug`; this parameter determines whether or not bucket names should be slugified automatically. All adapters but the local storage adapter have set this by default to true.

The Amazon S3 adapter has for instance a default option `apiVersion` which is set to "2006-03-01" and the local disk adapter has a default option `mode` that is set to `0o777`.

## Adapters

Below follows a description of the configuration objects and urls of the available adapters. You can add more adapters yourself, see [below](#adding-more-adapters)

### Local storage

> peer dependencies: <br/> > `npm i glob rimraf`

Configuration object:

```typescript
type ConfigLocal = {
  type: StorageType;
  directory: string;
  options?: JSON;
  bucketName?: string;
};
```

Configuration url:

```typescript
const url = "local://directory/bucket?option1=value1&...";
// or
const url = "local://directory?bucketName=bucket&option1=value1&...";
```

Example:

```typescript
const config = {
  type: StorageType.LOCAL,
  directory: "path/to/folder/bucket",
};
const s = new Storage(config);

// or
const url = "local://path/to/folder/bucket";
const s = new Storage(url);
```

Files will be stored in `path/to/folder/bucket`, folders will be created if necessary.

If you use a config object and you omit a value for `bucketName`, the last folder of the provided directory will be used.

```typescript
// example #1
const s = new Storage {
  type: StorageType.LOCAL,
  directory: "path/to/folder",
  bucketName: "bucket",
};
const s = new Storage("local://path/to/folder?bucketName=bucket")
s.getConfiguration().directory;  // 'path/to/folder'
s.getConfiguration().bucketName; // 'bucket'

// example #1a => resulting in same configuration as example #1
const s = new Storage {
  type: StorageType.LOCAL,
  directory: "path/to/folder",
  bucketName: "bucket",
};
const s = new Storage("local://path/to/folder?bucketName=bucket")
s.getConfiguration().directory;  // 'path/to/folder'
s.getConfiguration().bucketName; // 'bucket'

// example #2
const s = new Storage {
  type: StorageType.LOCAL,
  directory: "files",
};
const s = new Storage("local://files") // note: 2 slashes
s.getConfiguration().directory;  // folder where the process runs, process.cwd()
s.getConfiguration().bucketName; // 'files'

// example #3
const s = new Storage {
  type: StorageType.LOCAL,
  directory: "/files",
};
const s = new Storage("local:///files") // note: 3 slashes
s.getConfiguration().directory;  // '/' root folder (may require extra permissions)
s.getConfiguration().bucketName; // 'files'

```

### Google Cloud

> peer dependencies: <br/> > `npm i @google-cloud/storage ramda`

Configuration object:

```typescript
type ConfigGoogleCloud = {
  type: StorageType;
  keyFilename: string; // path to key-file.json,
  projectId?: string;
  bucketName?: string;
  options?: JSON;
};
```

Configuration url:

```typescript
const url = "gcs://path/to/key_file.json:project_id?bucketName=bucket&option1=value1&...";
```

The project id is optional; if you omit the value for project id, the id will be read from the key file:

```typescript
const s = new Storage({
  type: StorageType.GCS,
  keyFilename: "path/to/key_file.json",
});
const s = new Storage("gcs://path/to/key_file.json");
s.getConfiguration().projectId; // the project id
```

The name of the bucket can be provided using the `bucketName` key or option:

```typescript
const s = new Storage({
  type: StorageType.GCS,
  keyFilename: "path/to/key_file.json",
  bucketName: "bucket",
});
const s = new Storage("gcs://path/to/key_file.json?bucketName=bucket");
s.getSelectedBucket(); // "bucket"
```

### Amazon S3

> peer dependencies: <br/> > `npm i aws-sdk`

Config object:

```typescript
type ConfigAmazonS3 = {
  type: StorageType;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName?: string;
  options?: JSON;
};
```

Configuration url:

```typescript
const url = "s3://key:secret?region=eu-west-2&bucketName=bucket&option1=value1&...";
```

Note that the more familiar @ notation (e.g. `s3://key:secret@region=eu-west-2/bucket` is not supported; this is because the format of the url has been leveled across all different storage types.

```typescript
const s = new Storage({
  type: StorageType.S3,
  accessKeyId: "key",
  secretAccessKey: "secret",
  bucketName: "bucket",
});
const s = new Storage("s3://key:secret?bucketName=bucket");
s.getSelectedBucket(); // "bucket"
```

### Backblaze B2

> peer dependencies: <br/> > `npm i backblaze-b2 @gideo-llc/backblaze-b2-upload-any`

Config object:

```typescript
type ConfigBackBlazeB2 = {
  type: StorageType;
  applicationKeyId: string;
  applicationKey: string;
  bucketName?: string;
  options?: JSON;
};
```

Configuration url:

```typescript
const url = "b2://application_key_id:application_key?bucketName=bucket&option1=value1&...";
```

```typescript
const s = new Storage({
  type: StorageType.B2,
  applicationKeyId: "key_id",
  applicationKey: "key",
  bucketName: "bucket",
});
const s = new Storage("b2://key_id:key?bucketName=bucket");
s.getSelectedBucket(); // "bucket"
```

## API methods

### test

```typescript
test():Promise<void>;
```

Runs a simple test to test the storage configuration. The test is a call to `listBuckets` and if it fails it throws an error.

### createBucket

```typescript
createBucket(name: string): Promise<string>;
```

Creates a new bucket, does not fail if the bucket already exists. If the bucket was created successfully (or it did already exist) it resolves with a simple "ok" or an empty string, else it will reject with an error message.

### selectBucket

```typescript
selectBucket(name: string | null): Promise<void>;
```

Selects a or another bucket for storing files, the bucket will be created automatically if it doesn't exist. If you pass `null` an empty string or nothing at all the currently selected bucket will be deselected.

### clearBucket

```typescript
clearBucket(name?: string): Promise<void>;
```

Removes all files in the bucket. If you omit the `name` parameter all files in the currently selected bucket will be removed. If no bucket is selected an error will be thrown.

### deleteBucket

```typescript
deleteBucket(name?: string): Promise<void>;
```

Deletes the bucket and all files in it. If you omit the `name` parameter the currently selected bucket will be deleted. If no bucket is selected an error will be thrown.

### listBuckets

```typescript
listBuckets(): Promise<string[]>
```

Returns a list with the names of all buckets in the storage.

### getSelectedBucket

```typescript
getSelectedBucket(): string
```

Returns the name of the currently selected bucket or an empty string ("") if no bucket has been selected yet.

### addFileFromPath

```typescript
addFileFromPath(filePath: string, targetPath: string): Promise<void>;
```

Copies a file from a local path to the provided path in the storage. The value for `targetPath` needs to include at least a file name; the value will be slugified automatically if `slug` is to true, see [default options](#default-options).

### addFileFromBuffer

```typescript
addFileFromBuffer(buffer: Buffer, targetPath: string): Promise<void>;
```

Copies a buffer to a file in the storage. The value for `targetPath` needs to include at least a file name; the value will be slugified automatically if `slug` is to true, see [default options](#default-options). This method is particularly handy when you want to move uploaded files to the storage, for instance when you use Express.Multer with [MemoryStorage](https://github.com/expressjs/multer#memorystorage).

### addFileFromReadable

```typescript
addFileFromReadable(stream: Readable, targetPath: string): Promise<void>;
```

Allows you to stream a file directly to the storage. The value for `targetPath` needs to include at least a file name; the value will be slugified automatically if `slug` is to true, see [default options](#default-options). This method is particularly handy when you want to store files while they are being processed; for instance if a user has uploaded a full-size image and you want to store resized versions of this image in the storage; you can pipe the output stream of the resizing process directly to the storage.

### getFileAsReadable

```typescript
getFileAsReadable(name: string, options?: {start?: number, end?: number}): Promise<Readable>;
```

Returns a file in the storage as a readable stream. You can specify a byte range by using the extra range argument, see these examples:

```typescript
getFileAsReadable("image.png"); // &rarr; reads whole file

getFileAsReadable("image.png", {}); // &rarr; reads whole file

getFileAsReadable("image.png", { start: 0 }); // &rarr; reads whole file

getFileAsReadable("image.png", { start: 0, end: 1999 }); // &rarr; reads first 2000 bytes

getFileAsReadable("image.png", { end: 1999 }); // &rarr; reads first 2000 bytes

getFileAsReadable("image.png", { start: 2000 }); // &rarr; reads file from byte 2000
```

### removeFile

```typescript
removeFile(name: string): Promise<void>;
```

Removes a file from the bucket. Does not fail if the file doesn't exist.

### sizeOf

```typescript
sizeOf(name: string): number;
```

Returns the size of a file in the currently selected bucket and throws an error if no bucket has been selected.

```typescript
sizeOf(name: string): Promise<boolean>;
```

Returns whether a file exists or not.

### listFiles

```typescript
listFiles(): Promise<[string, number][]>;
```

Returns a list of all files in the currently selected bucket; for each file a tuple is returned containing the path and the size of the file. If no bucket is selected an error will be thrown.

### getType

```typescript
getType(): string;
```

Returns the type of storage, calue is one of the enum `StorageType`.

### getOptions

```typescript
getOptions(): JSON
```

Returns an object containing all options: the default options overruled or extended by the options provided by the configuration object or URL.

### getConfiguration

```typescript
getConfiguration(): AdapterConfig
```

Retrieves configuration as provided during instantiation. If you have provided the configuration in url form, the function will return an configuration object. Note that the actual value may differ from the values returned. For instance if you have selected a different bucket after initialization, the key `bucketName` in the configuration object that this method returns will still hold the value of the initially set bucket. Use `getSelectedBucket()` to retrieve the actual value of `bucketName`.

### switchAdapter

```typescript
switchAdapter(config: string | AdapterConfig): void;
```

Switch to another adapter in an existing `Storage` instance at runtime. The config parameter is the same type of object or URL that you use to instantiate a storage. This method can be handy if your application needs a view on multiple storages. If your application needs to copy over files from one storage to another, say for instance from Google Cloud to Amazon S3, then it is more convenient to create 2 separate `Storage` instances. This method is also called by the constructor to instantiate the initial storage type.

## How it works

When you create a `Storage` instance you create a thin wrapper around one of the available adapters:

- `AdapterLocal`
- `AdapterGoogleCloud`
- `AdapterAmazonS3`
- `AdapterBackblazeB2`

The API is defined in the wrapper class `Storage` and the adapter classes translate the generic API methods to storage type specific functionality. The wrapper creates an instance of one of these adapter classes based on the provided configuration and then forwards every API call to this instance.

This is possible because both the wrapper and the adapter classes implement the interface `IStorage`. This interface declares all API methods listed above except `switchAdapter`; this method is implemented in the `Storage` class. The wrapper itself has hardly any functionality apart from `switchAdapter`.

The adapter classes all extend the class `AbstractStorage`, as you would have guessed this is an abstract class that cannot be instantiated. Its purpose is to implement functionality that can be used across all derived classes; it implements some generic functionality that is used by `addFileFromBuffer`, `addFileFromPath` and `addFileFromReadable`. For the rest it contains stub methods that need to be overruled or extended by the adapter subclasses.

It is also possible to add an adapter that is not a class but a function -> FP instead of OO

More adapter classes can be added for different storage types, note however that there are many cloud storage providers that keep their API compliant with Amazon S3, for instance [Wasabi](https://wasabi.com/).

## Tests

If you want to run the tests you have to checkout the repository from github and install all dependencies with `npm install` or `yarn install`. The tests test all storage types; for Google Cloud and Amazon S3 you need add your credentials to a `.env` file, see the file `.env.default` for more explanation. To run the Jasmine tests use this command:

`npm run test-jasmine`

You can run tests per storage type using one of these commands, see also the file `package.json`:

```bash
# test local disk
npm run test-local
# test Google Cloud Storage
npm run test-gcs
# test Amazon S3
npm run test-s3
```

You can find some additional non-Jasmine tests in the file `tests/test.ts`. You can test a single type of storage or run all tests, just open the file and uncomment you want to run and:

`npm test`

## Adding more adapters

You can add your own adapter by following these steps:

- TBD

## Example application

A simple application that shows how you can use the storage abstraction package can be found in [this repository](https://github.com/tweedegolf/storage-abstraction-example). It uses and Ts.ED and TypeORM and it consists of both a backend and a frontend.

## Questions and requests

Please let us know if you have any questions and/or request by creating an [issue](https://github.com/tweedegolf/storage-abstraction/issues).
