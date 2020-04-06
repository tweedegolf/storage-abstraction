# Storage Abstraction

Provides an abstraction layer for interacting with a storage; this storage can be a local file system or a cloud storage. For cloud storage currently Google Cloud and Amazon S3 and compliant cloud services are supported.

Because the API only provides basic storage operations (see [below](#api)) the API is cloud agnostic. This means for instance that you can develop your application using storage on local disk and then use Google Cloud or Amazon S3 in your production environment without changing any code.

<a name="instantiate-a-storage"></a>

## Instantiate a storage

```javascript
const s = new Storage(config);
```

Each type of storage requires a different configuration. You can provide the configuration in 2 forms:

1. as a configuration object (js: `typeof === "object"` ts: `StorageConfig`)
2. as a url (`typeof === "string"`)

The only key that the configurations have in common is the name of the bucket. This is an optional key. For local storage, the bucket name simply is the name of a directory. If you provide a value for `bucketName` in the config object, this bucket will be created if it doesn't exist and selected automatically for storing and reading files. If you don't set a value for `bucketName` you can only store and read files after you have selected a bucket by using `selectBucket`, see below.

All configuration urls start with a protocol:

- `local://` for local storage
- `gcs://` for Google Cloud
- `s3://` for Amazon S3

What follows after this protocol is the part that contains the configuration of the storage.

Each storage instance has a member `type` whose value is one of the enum members of `StorageType`. You can query this value using the `introspect` method which is described below.

```typescript
enum StorageType {
  LOCAL = "local",
  GCS = "gcs",
  S3 = "s3",
}
```

<a name="local-storage"></a>

### Local storage

```typescript
type ConfigLocal = {
  bucketName?: string;
  directory?: string;
};
```

Example:

```typescript
const config = {
  bucketName: "images",
  directory: "/home/user/domains/my-site",
};
const s = new Storage(config);

// or
const url = "local:///home/user/domains/my-site/images";
const s = new Storage(url);
```

Files will be stored in `/home/user/domains/my-site/images`, folders will be created if necessary.

Note that the configuration url contains 3 consecutive slashes; this is because the configuration tells us to store files in a subdirectory of the root directory. The same url with 2 slashes would store the files in a directory relative to the directory where the process that uses the storage abstraction module runs, let's assume the process runs in `/usr/bin/node`:

```typescript
const url = "local://home/user/domains/my-site/images";
const s = new Storage(url);
```

Files will now be stored in `/usr/bin/node/home/user/domains/my-site/images`.

You can also create a local storage by not providing any configuration at all:

```typescript
const s = new Storage();
console.log(s.introspect("type")); // logs: 'local'
console.log(s.introspect("bucketName")); // logs: 'local-bucket'
```

Note that the name of the bucket appears to be `local-bucket` although we haven't provided any value. If you don't provide a bucket name this folder will be created for you in the directory where the process runs (`process.cwd()`).

If you use a config object and you omit a value for `bucketName`, the last folder of the provided directory will be used. If you don't provide a value for `directory` either, you will get the same result as when you don't specify any configuration at all.

```typescript
// example #1
const s = new Storage {
  directory: "path/to/my/files",
};
s.introspect("directory");  // 'path/to/my/'
s.introspect("bucketName"); // 'files'

// example #2
const s = new Storage {
  directory: "files",
};
s.introspect("directory");  // folder where the process runs, process.cwd()
s.introspect("bucketName"); // 'files'

// example #3
const s = new Storage {
  directory: "/files",
};
s.introspect("directory");  // '/' root folder (may require extra permissions)
s.introspect("bucketName"); // 'files'

// example #4
const s = new Storage {
  directory: "",
  bucketName: "",
};
s.introspect("directory");  // folder where the process runs
s.introspect("bucketName"); // 'local-bucket'
```

<a name="google-cloud"></a>

### Google Cloud

Config object:

```typescript
type ConfigGoogleCloud = {
  bucketName?: string;
  projectId?: string;
  keyFilename: string; // path to key-file.json,
};
```

Configuration url:

```typescript
const url = "gcs://path/to/key_file.json:project_id/bucket_name";
```

If you omit the value for project id, the id will be read from the key file:

```typescript
// url
const s1 = new Storage("gcs://path/to/key_file.json/bucket_name");
console.log(s1.introspect("projectId")); // logs the project id

// config object
const s2 = new Storage({ keyFilename: "path/to/key_file.json" });
console.log(s2.introspect("projectId")); // logs the project id
```

<a name="amazon-s3"></a>

### Amazon S3

Config object:

```typescript
type ConfigAmazonS3 = {
  bucketName?: string;
  accessKeyId: string;
  secretAccessKey: string;
  // additional parameters
  endpoint?: string;
  useDualstack?: boolean;
  region?: string;
  maxRetries?: number;
  maxRedirects?: number;
  sslEnabled?: boolean;
  apiVersion?: string;
};
```

Configuration url:

```typescript
// using @ notation
const url = "s3://key:secret@eu-west-2/the-buck";

// using @ notation with additional parameters in query string
const url = "s3://key:secret@eu-west-2/the-buck?sslEnabled=true&useDualstack=true";

// using query string for all parameters
const url = "s3://key:secret?region=eu-west-2&bucket=the-buck&sslEnabled=true&useDualstack=true";
```

All provided additional parameters will be typo- and type-checked:

```typescript
const url = "s3://key:secret?endPoint=https://kms-fips.us-west-2.amazonaws.com&useDualStack=23";
const s = new Storage(s);
console.log(s.introspect("endpoint")); // undefined because of typo: endPoint !== endpoint
console.log(s.introspect("useDualStack")); // undefined because type of useDualStack must be boolean
```

If you provide a value for region or bucket name using both the `@` notation and the query string notation, the latter values will prevail:

```typescript
const url = "s3://key:secret@us-east-1/bucket1?region=eu-west-2&bucketName=bucket2";
const s = new Storage(url);
// last values overrule earlier values:
console.log(s.introspect("region")); // 'eu-west-2' (not 'us-east-1')
console.log(s.introspect("bucketName")); // 'bucket2' (not 'bucket1')
```

You can omit the region in the `@` notation variant but you have to add a slash after the `@` because a `secretAccessKey` can contain slashes:

```typescript
const url1 = "s3://key:secret/can/contain/slashes@/the-buck"; // works!
const url2 = "s3://key:secret/can/contain/slashes@the-buck"; // error
```

<a name="api"></a>

## API methods

### test

```typescript
test():Promise<void>;
```

Runs a simple test to test the storage configuration. The test is a call to `listBuckets` and if it fails it throws an error.

### createBucket

```typescript
createBucket(name: string): Promise<void>;
```

Creates a new bucket, does not fail if the bucket already exists.

### selectBucket

```typescript
selectBucket(name: string | null): Promise<void>;
```

Selects a or another bucket for storing files, the bucket will be created automatically if it doesn't exist. If you pass `null` the currently selected bucket will be deselected.

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
getSelectedBucket(): string | null
```

Returns the name of the currently selected bucket or `null` if no bucket has been selected yet.

### addFileFromPath

```typescript
addFileFromPath(filePath: string, targetPath: string): Promise<void>;
```

Copies a file from a local path to the provided path in the storage. The value for `targetPath` needs to include at least a file name; the value will be slugified automatically.

### addFileFromBuffer

```typescript
addFileFromBuffer(buffer: Buffer, targetPath: string): Promise<void>;
```

Copies a buffer to a file in the storage. The value for `targetPath` needs to include at least a file name; the value will be slugified automatically. This method is particularly handy when you want to move uploaded files to the storage, for instance when you use Express.Multer with [MemoryStorage](https://github.com/expressjs/multer#memorystorage).

### addFileFromReadable

```typescript
addFileFromReadable(stream: Readable, targetPath: string): Promise<void>;
```

Allows you to stream a file directly to the storage. The value for `targetPath` needs to include at least a file name; the value will be slugified automatically. This method is particularly handy when you want to store files while they are being processed; for instance if a user has uploaded a full-size image and you want to store resized versions of this image in the storage; you can pipe the output stream of the resizing process directly to the storage.

### getFileAsReadable

```typescript
getFileAsReadable(name: string, options?: {start?: number, end?: number}): Promise<Readable>;
```

Returns a file in the storage as a readable stream. You can specify a byte range by using the `options` argument, see these examples:

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

### introspect

```typescript
introspect(key?: string): string | StorageType | StorageConfig;
```

Retrieves configuration settings from a storage. If you use it without arguments it will return the complete configuration object. Sensitive values will not be shown. If you do provide an argument you can retrieve a specific value of the configuration.

```typescript
const s = new Storage("local://my-folder/my-bucket");
const type = s.introspect("type"); // local
const bucketName = s.introspect("bucket"); // my-bucket
```

### listFiles

```typescript
listFiles(): Promise<[string, number][]>;
```

Returns a list of all files in the currently selected bucket; for each file a tuple is returned containing the path and the size of the file. If no bucket is selected an error will be thrown.

### switchStorage

```typescript
switchStorage(config: string | StorageConfig): void;
```

Switch to another storage type in an existing `Storage` instance at runtime. The config object or url is the same type of object or url that you use to instantiate a storage. This method can be handy if your application needs a view on multiple storages. If your application needs to copy over files from one storage to another, say for instance from Google Cloud to Amazon S3, then it is more convenient to create 2 separate `Storage` instances. This method is also called by the constructor to instantiate the initial storage type.

## How it works

When you create a `Storage` instance you create a thin wrapper around one of these classes:

- `StorageLocal`
- `StorageGoogleCloud`
- `StorageAmazonS3`

Let's call these classes the adapter classes because they actually translate the general API methods to storage type specific functionality. The wrapper creates an instance of one of these adapter classes based on the provided configuration and then forwards every API call to this instance.

This is possible because both the wrapper and the adapter classes implement the interface `IStorage`. This interface declares all API methods listed above except `switchStorage`; this method is implemented in the `Storage` class. The wrapper itself has hardly any functionality apart from `switchStorage`.

The adapter classes all extend the class `AbstractStorage`, as you would have guessed this is an abstract class that cannot be instantiated. Its purpose is to implement functionality that can be used across all derived classes; it implements some generic functionality that is used by `addFileFromBuffer`, `addFileFromPath` and `addFileFromReadable`. For the rest it contains stub methods that need to be overruled or extended by the adapter subclasses.

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

## Example application

A simple application that shows how you can use the storage abstraction package can be found in [this repository](https://github.com/tweedegolf/storage-abstraction-example). It uses and Ts.ED and TypeORM and it consists of both a backend and a frontend.

## Questions and requests

Please let us know if you have any questions and/or request by creating an [issue](https://github.com/tweedegolf/storage-abstraction/issues).
