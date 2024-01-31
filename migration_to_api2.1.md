- Every API method that accesses the cloud storage service returns a Promise that resolves to an object:

  ```typescript
  type ResultObject = {
    error: string | null;
    value: string | number | Array<[string, number]> | Array<String> | Readable; // depends on method
  };
  ```

- The storage instance will also no longer hold a reference to all available buckets; a call to `listBuckets` will access the cloud storage service every time it is called; this is handy in case another process or user has created or deleted a new bucket.
- `createBucket` resolves with an error if that bucket already exists
- `removeFile` has an additional optional boolean argument `allVersions`; if set to true all versions of the specified file will be removed. Default: false
- `addFile` is added to the API; you can use this method instead of `addFileFromPath`, `addFileFromBuffer` or `addFileFromReadable`
- Extended and updated the introspect API of the adapter:
  - `getConfig()` and `getType()` are implemented as getter as well, resp.: `storage.config` and `storage.type`
  - added `configError` and `storage.configError`
  - added `getServiceClient` and `storage.serviceClient`
  - added getter and setter for (de)selecting the bucket; `storage.bucket = "the-buck"` and `console.log(storage.bucket)`
- Supported storages:
  - Amazon S3
  - Cubbit
  - Cloudflare R2
  - Backblaze B2 S3 compatible
  - Backblaze B2
  - Google Cloud
  - Azure Blob
  - MinIO
  - local storage

### Configuration URLs

The format of the configuration URLs is more consistent across the storage services. The `@region` part of the config URL of the AmazonS3 adapter has been moved to the query string.

```typescript
// old format:
const u = "s3://accessKeyId:secretAccessKey@region/bucketName?option1=value1&option2=value2...";

// new format:
const v = "s3://accessKeyId:secretAccessKey@bucketName?region=us-west-1&option2=value2...";
```

The general format is:

```typescript
const u = "protocol://part1:part2@bucketName?option1=value1&option2=value2...";
```

Which translates for most storage services into:

```typescript
const u = "storage_type://credential1:credential2@bucketName?option1=value1&option2=value2...";
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
`selectBucket(name: string | null): void`<br/>

#### getSelectedBucket

`getSelectedBucket(): string`<br/>
`getSelectedBucket(): string | null`<br/>

#### validateName

`validateName(name: string): string`<br/>
`N/A`

#### listBuckets

`listBuckets(): Promise<string[]>`<br/>
`listBuckets(): Promise<ResultObjectBuckets>`

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
`listFiles(bucketName: string): Promise<ResultObjectFiles>`

#### sizeOf

`sizeOf(name: string): Promise<number>`<br/>
`sizeOf(bucketName: string, fileName: string): Promise<ResultObject>`

#### fileExists

`fileExists(name: string): Promise<boolean>`<br/>
`fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean>`

#### getFileAsReadable

```typescript
getFileAsReadable(
    name: string,
    options?: { start?: number; end?: number }
  ): Promise<Readable>
```

```typescript
getFileAsStream(
    bucketName: string,
    fileName: string,
    options?: { [id: string]: any }
  ): Promise<ResultObjectStream>
```

#### addFileFromPath

```typescript
addFileFromPath(origPath: string, targetPath: string, options: object = {}): Promise<string>
```

```typescript
addFileFromPath(params: FilePathParams): Promise<ResultObject>
```

#### addFileFromBuffer

```typescript
addFileFromBuffer(buffer: Buffer, targetPath: string, options: object = {}): Promise<string>
```

```typescript
addFileFromBuffer(params: FileBufferParams): Promise<ResultObject>
```

#### addFileFromReadable

```typescript
addFileFromReadable(stream: Readable, targetPath: string, options: object = {}): Promise<string>
```

```typescript
addFileFromStream(FileStreamParams): Promise<ResultObject>
```

### The `init` function is not required anymore

Only Backblaze B2 Native API storage requires initial authorization by calling the async `authorize` function. This authorization step was performed once by calling the `init` method. Although it would yield an error, it was still possible to call API methods without calling `init` prior to that. In the new version every API call checks if the initial authorization has been performed.

Other storage services do not require initial authorization but their `init` method was used to select and/or create the bucket that was provided in the config.

Because in the new API seeks to be more transparent, there will be no more 'magic behind the screen'. So if you want to create a bucket (provided you have the access rights to do so) you have to call `createBucket` explicitly.

Also the new version tries to keep as little local state as possible so `selectBucket` and `getSelectedBucket` have been removed.

Because of all aforementioned changes the `init` is no longer required! You can start calling API methods right after instantiating a storage:

```typescript
const b2 = new Storage("b2://applicationKeyId=your-key-id&applicationKey=your-key");
await b2.listBuckets();
```

### The bucket in the config is no longer automatically selected or created

However, the bucket name that you've provided with the configuration url or object is available by calling `getConfig`:

```typescript
const  s3 = new Storage("s3://key=key&secret=secret&region=eu-west-2&bucketName=erwe");
await s3.listFiles(s3.config.bucketName, "your-file.jpg')
```
