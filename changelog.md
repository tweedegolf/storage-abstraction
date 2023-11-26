# 2.0.0

- Every API method that needs access to the abstracted cloud storage service returns a Promise that resolves to an object:
  ```typescript
  type ResultObject = {
    error: string | null;
    value: string | number | Array<[string, number]> | Array<String> | Readable; // depends on method
  };
  ```
- Perhaps a type for all possible return values:

  ```typescript
  // most common type
  type ResultObject = {
    error: string | null;
    value: string | null;
  };

  type ResultObjectNumber = {
    error: string | null;
    value: number | null;
  };

  type ResultObjectFiles = {
    error: string | null;
    value: Array<[string, number]> | null;
  };

  type ResultObjectBuckets = {
    error: string | null;
    value: Array<string> | null;
  };

  type ResultObjectReadable = {
    error: string | null;
    value: Readable | null;
  };
  ```

- ~~`init` will automatically select (and if necessary create) the bucket if your configuration object or url has a value set for `bucketName`~~
- ~~Backblaze B2 native API storage requires initial authorization (by calling the async `authorize` function) so `init` will only be implemented for this type of storage. For other storage type `init` will be a stub.~~
- No more magic behind the screen; `init` and `selectBucket` have been removed.
- No more local state: the storage instance will no longer hold a reference to the last used or selected bucket in its local state; you will have to provide a bucket name for every bucket operation, for instance `clearBucket`, but also `removeFile`.
- The storage instance will also no longer hold a reference to all available buckets; a call to `listBuckets` will access the cloud storage service every time it is called; this is handy in case another process or user has created a new bucket.
- `validateName` will not only perform a local check, it will also check if the name is valid and/or not taken at the cloud storage service.
- `createBucket` resolves with an error when that bucket already exists
- ~~`deleteBucket` has been renamed to `removeBucket` (analogue to `removeFile`)~~
- `removeFile` has an additional optional boolean argument `allVersions`; if set to true all version of the specified file will be removed. Default: false
- `addFile` is added; you can use this method whenever you use `addFileFromPath`, `addFileFromBuffer` or `addFileFromReadable`
- `getConfig()` and `getType()` are implemented as getter as well, resp.: `storage.config` and `storage.type`
- The configuration object are no longer extensible; if you want to provide extra parameters you can use the `options` object, for instance:
- removed adapter config types

```typescript
 const conf: ConfigAmazonS3 = {
    accessKeyId: "yourKeyId";
    secretAccessKey?: "yourAccessKey";
    region: "us-east-2";
    endpoint: "yourEndpoint";
    options: {
      systemClockOffset: 40000,
      useArnRegion: true,
    }
 }
```

### Old API (1.5.x) compared to new API (2.x)

#### init

`init(config):Promise<boolean>`<br/>
`N/A`

#### test

`test():Promise<string>`<br/>
`N/A`

#### selectBucket

`selectBucket(name: string | null): Promise<string>`<br/>
`N/A`

#### getSelectedBucket

`getSelectedBucket(): string`<br/>
`N/A`

#### createBucket

`createBucket(name: string, options?: object): Promise<string>`<br/>
`createBucket(name: string, options?: object): Promise<ResultObject>`

#### clearBucket

`clearBucket(name?: string): Promise<string>`<br/>
`clearBucket(name: string): Promise<ResultObject>`

#### deleteBucket

`deleteBucket(name?: string): Promise<string>`<br/>
`deleteBucket(name: string): Promise<ResultObject>`

#### removeFile

`removeFile(fileName: string): Promise<string>`<br/>
`removeFile(bucketName: string, fileName: string): Promise<ResultObject>`

#### listFiles

`listFiles(): Promise<[string, number][]>`<br/>
`listFiles(bucketName: string): Promise<ResultObject>`

#### listBuckets

`listBuckets(): Promise<string[]>`<br/>
`listBuckets(): Promise<ResultObject>`

#### sizeOf

`sizeOf(name: string): Promise<number>`<br/>
`sizeOf(bucketName: string, fileName: string): Promise<ResultObject>`

#### fileExists

`fileExists(name: string): Promise<boolean>`<br/>
`fileExists(bucketName: string, fileName: string): Promise<ResultObject>`

#### validateName

`validateName(name: string): string`<br/>
`validateName(name: string): Promise<ResultObject>`

#### getFileAsReadable

```typescript
getFileAsReadable(
    name: string,
    options?: { start?: number; end?: number }
  ): Promise<Readable>
```

```typescript
getFileAsReadable(
    bucketName: string,
    fileName: string,
    options?: { start?: number; end?: number }
  ): Promise<ResultObject>
```

#### addFileFromPath

```typescript
addFileFromPath(origPath: string, targetPath: string, options: object = {}): Promise<string>
```

```typescript
addFileFromPath({
  bucketName: string,
  origPath: string,
  targetPath: string,
  options: object = {}
  }): Promise<ResultObject>
```

#### addFileFromBuffer

```typescript
addFileFromBuffer(buffer: Buffer, targetPath: string, options: object = {}): Promise<string>
```

```typescript
addFileFromBuffer({
  bucketName: string,
  buffer: Buffer,
  targetPath: string,
  options: object = {}
  }): Promise<ResultObject>
```

#### addFileFromReadable

```typescript
addFileFromReadable(stream: Readable, targetPath: string, options: object = {}): Promise<string>
```

```typescript
addFileFromReadable({
  bucketName: string,
  stream: Readable,
  targetPath: string,
  options: object = {},
  }): Promise<ResultObject>
```

### Some other ideas

Maybe merge all `addFileFrom*` methods into a single `addFile` method that behaves differently dependent on the given argument/parameter:

```typescript
type FilePath = {
  bucketName: string,
  origPath: string,
  targetPath: string,
  options?: object,
}

type FileBuffer = {
  bucketName: string,
  buffer: Buffer,
  targetPath: string,
  options?: object,
}

type FileStream = {
  bucketName: string,
  stream: Readable,
  targetPath: string,
  options?: object,
}

addFile(FilePath | FileBuffer | FileStream): Promise<ResultObject>
```

And analogue to this:

```typescript
enum FileReturnType = {
  Stream,
  SomethingElse,
  ...
}

type GetFile = {
  bucketName: string,
  fileName: string,
  type: FileReturnType,
  options?: { start?: number; end?: number }
}

getFile(GetFile): Promise<ResultObjectStream | ResultObject>
```

### The `init` function is not required anymore

Only Backblaze B2 Native API storage requires initial authorization by calling the async `authorize` function. This authorization step was performed once by calling the `init` method. Although it would yield an error, it was still possible to call API methods without calling `init` prior to that. In the new version every API call checks if the initial authorization has been performed.

Other storage services do not require initial authorization but their `init` method was used to select and/or create the bucket that was provided in the config.

Because in the new API seeks to be more transparent, there will be no more 'magic behind the screen'. So if you want to create a bucket (provided you have the access rights to do so) you have to call `createBucket` explicitly.

Also the new version tries to keep as little local state as possible so `selectBucket` and `getSelectedBucket` have been removed.

Because of all aforementioned changes the `init` is no longer required! You can start calling API methods right after instantiating a storage:

```typescript
const b2 = new Storage("b2://applicationKeyId:applicationKey");
await b2.listBuckets();
```

### The bucket in the config is no longer automatically selected or created

However, the bucket name that you've provided with the configuration url or object is available by calling `getConfig`:

```typescript
const  s3 = new Storage("s3://key:secret@eu-west-2/bucketName");
await s3.listFiles(s3.getConfig().bucketName, "your-file.jpg')
```

# 1.4.7 - 1.5.2

- Added support for Azure &rarr; all credits: [tesirm99](https://github.com/tesirm99)
- Upgrade all packages
- Fixed numerous async errors
- AdapterAmazonS3: use `s3-request-presigner` to create links to objects
- AdapterAmazonS3: added support for S3 compatible storages (tested with Cloudflare R2 and Backblaze S3)
- AdapterLocal now treats values without prefix passed to `mode` as decimal number instead of octal numbers
- AdapterLocal: if you pass the config as an object and you don't provide a value for `bucketName`, the bucketName will no longer be set to the last folder of the value you provide for `directory`. In other words: if you want to set a value for `bucketName` you have to add it specifically to the config object.

# 1.4.5

- Remove option 'slug' in config: this makes the user responsible for choosing a valid bucket name.
- Add `options` to `createBucket`.
- Add `options` to `addFileFromPath`, `addFileFromBuffer` and `addFileFromReadable`.
- Add `skipCheck` to configuration object and made all keys optional
- Return public url after a file has been successfully added to a bucket

# 1.4.4

- use '@aws-sdk/client-s3' instead of 'aws-sdk'
- eslint fixes

# 1.4.3

- Removed `await-to-js` dependency in local storage adapter

# 1.4.2

- Added `ConfigAmazonS3`, `ConfigBackblazeB2`, `ConfigGoogleCloud` and `ConfigLocal` to exported types
- Removed `await-to-js` dependency

# 1.4.1

- Added `AdapterConfig` to exported types

# 1.4.0

- Changed the name of the 'functional classes' from Storage to Adapter, e.g. `StorageAmazonS3` became `AdapterAmazonS3`
- Replaced `introspect()` by `getConfiguration():AdapterConfig` and `getType():string`
- Added adapter class for BackBlaze B2
- Made configuration more generic and extensible
- Removed option to create a new Storage without configuration (StorageLocal)
- Added default storage options that can be overruled or extended by the config object or url
- Made slugify optional and turned it off by default for StorageLocal
- Added API method `fileExists():Promise<boolean>`
- In the configuration object or string non-existent keys or invalid values are no longer filtered out: it is the programmer's responsibility to provide valid options
- If no bucket name is provided the bucket name will always be an empty string "", not `undefined` or `null`. Also when no bucket is selected `bucketName` will be "".
- Adapter modules are only loaded when needed (using `require`)
- Removed options from both configuration and adapters.
- Formalized return values

# 1.3.1

- Removed sloppy code: parsing and validation of configuration is now done in one [place](https://github.com/tweedegolf/storage-abstraction/blob/master/src/util.ts).
- Removed jasmine-ts dependency

# 1.3.0

- Removed `getFileByteRangeAsReadable` and merged the functionality in `getFileAsReadable` by adding a range parameter `{start: number, end: number}`
- Removed the option to instantiate a specific storage type directly; all instantiating must be done with `new Storage(config)`.
- Optimized `getFileAsReadable` for Google Cloud.
- Implemented `addFileFromReadable`, fixes [issue#2](https://github.com/tweedegolf/storage-abstraction/issues/2)
- Added configuration urls: all configuration options in a single string.
- When creating a local storage without specifying a directory, the directory where the process runs will be used (in earlier versions the os' tmp folder was used)
- When creating a local storage without specifying a bucket name, a directory named `local-bucket` will be created and used as selected bucket.
- When using `new Storage()` without configuration you create a local storage instance with the default configuration (as described in the 2 bullets above).
- Updated documentation.
- Updated dependency version.
- Added yarn.lock.
- Renamed 'functional classes' to 'adapter classes'

# 1.2.1

(Pull request #3)[https://github.com/tweedegolf/storage-abstraction/pull/3]

- Implemented `sizeOf`, `getFileByteRangeAsReadable`
- Improved AWS performance

# 1.1.16

(Pull request #1)[https://github.com/tweedegolf/storage-abstraction/pull/1]

- Expanded the S3 configuration options
