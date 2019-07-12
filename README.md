# Storage Abstraction

Provides an API for storing and retrieving files from a storage; this storage can be a local file system or a cloud storage. For cloud storage currently Google Cloud and Amazon S3 and compliant cloud services are supported.

## Instantiate a storage

```javascript
const s = new Storage(config);
```

Each type of storage requires a different config object, the only key that these config objects have in common is the name of the bucket. This is an optional key. For local storage, the bucket name simply is the name of a directory. If you provide a value for `bucketName` in the config object, this bucket will be created if it doesn't exist and selected automatically for storing files. If you don't set a value for `bucketName` you can only store files after you have selected a bucket by using `selectBucket`, see below.

### Local storage
```typescript
type config = {
  bucketName?: string,
  directory?: string, // if omitted the default TMP dir of the os will be used
}
```
Example: 

```typescript
const config = {
  bucketName: 'images',
  directory: '/home/user/domains/my-site',
}
const s = new Storage(config); 
```
Files will be stored in `/home/user/domains/my-site/images`, folders will be created if necessary.

### Google Cloud
```typescript
type config = {
  bucketName?: string,
  projectId: string,
  keyFilename: string, // path to key-file.json,
}
```

### Amazon S3
```typescript
type config = {
  bucketName?: string,
  accessKeyId: string,
  secretAccessKey: string,
}
```

## API methods

### createBucket
```typescript
createBucket(name: string): Promise<boolean>;
```
Once the bucket has been created `true` will be returned; if the bucket already existed `true` will be returned as well.

### selectBucket
```typescript
selectBucket(name: string): Promise<boolean>;
```
Select another bucket for storing files, the bucket will be created automatically if it doesn't exist.

### clearBucket
```typescript
clearBucket(name?: string): Promise<boolean>;
```
Removes all files in the bucket. If you omit the `name` parameter all files in the currently selected bucket will be removed. If no bucket is selected an error will be thrown.

### deleteBucket
```typescript
deleteBucket(name?: string): Promise<boolean>;
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
addFileFromPath(filePath: string, targetPath: string): Promise<boolean>;
```
Copies a file from a local path to the provided path in the storage. The value for `targetPath` needs to include at least a file name plus extension; the value will be slugified automatically.

### addFileFromBuffer
```typescript
addFileFromUpload(buffer: Buffer, targetPath: string): Promise<boolean>;
```
Copies a buffer to a file in the storage. The value for `targetPath` needs to include at least a file name plus extension; the value will be slugified automatically. This method is particularly handy when you want to move uploaded files to the storage, for instance when you use Express.Multer with DiskStorage.

### getFileAsReadable
```typescript
getFileAsReadable(name: string): Promise<Readable>;
```
Returns a file in the storage as a readable stream.

### removeFile
```typescript
removeFile(name: string): Promise<boolean>;
```
Removes a file from the bucket. Returns `true` if the file didn't exist.

### listFiles
```typescript
listFiles(): Promise<[string, number][]>;
```
Returns a list of all files in the currently selected bucket; for each file a tuple is returned containing the path and the size of the file. If no bucket is selected an error will be thrown.

### switchStorage
```typescript
switchStorage(config: StorageConfig): void;
```
Switch to another storage type in an existing `Storage` instance at runtime. The config object is the same type of object that you use to instantiate a storage. This method can be handy if your application needs a view on multiple storages. If your application needs to copy over files from one storage to another, say for instance from Google Cloud to Amazon S3, then it is more convenient to create 2 separate `Storage` instances.


## How it works

When you create a `Storage` instance you create a thin wrapper around one of these classes:

- `StorageLocal`
- `StorageGoogleCloud`
- `StorageAmazonS3`

Let's call these classes the functional classes because they actually define the functionality of the API methods. The wrapper creates an instance of one of these functional classes based on the provided config object and then forwards every API call to this instance. 

This is possible because both the wrapper and the functional classes implement the interface `IStorage`. This interface declares all API methods listed above except for the last one, `switchStorage`; this method is implemented in the `Storage` class. The wrapper itself has hardly any functionality apart from `switchStorage`; it is called by the constructor as well. 

The functional classes all extend the class `AbstractStorage`, as you would have guessed this is an abstract class that cannot be instantiated. Its purpose is to implement functionality that can be used across all derived classes; it implements some generic functionality that is used by `addFileFromBuffer` and `addFileFromPath`. For the rest it contains stub methods that need to be overruled or extended by the functional subclasses.

If your application doesn't need `switchStorage` you can also instantiate a functional class directly:

```typescript
// config is for Google Cloud storage
const config = {
  bucketName: 'images',
  projectId: 'id-of-your-project',
  keyFilename: 'path/to/json/key-file',
}
const s1 = new Storage(config); 

// or directly:
const s2 = new StorageGoogleCloud(config);
```
Note that `s1` and `s2` are not the same; the `s1` instance has a private member `storage` that is an instance of `StorageGoogleCloud`. 

More functional classes can be added for different storage types, note however that there are many storage vendors that keep their API compliant with Amazon S3.

## Tests

If you want to run the tests you have to checkout the repository from github and install all dependencies with ```npm install```. The tests test all storage types; for Google Cloud and Amazon S3 you need add your credentials to a `.env` file, see the file `.env.default` for more explanation. To run the Jasmine tests use this command:

```npm test```

You can find some additional non-Jasmine tests in the file `tests/test.ts`. Uncomment the type of storage you want to test and run:

```npm run test2```

## Example application

There is sample application that uses the storage abstraction and TsED and TypeORM. 

- ```cd ./example```
- ```docker-compose run backend npm i```
- ```docker-compose up```

Application available at https://localhost

