# Storage Abstraction

Provides an API for storing and retrieving files from a storage; this storage can be a local file system or a cloud storage. For cloud storage currently Google Cloud and Amazon S3 and compliant cloud services are supported.

## Instantiate a storage

```javascript
const s = new Storage(config);
```

Each type of storage requires a different config object, the only key that these config objects have in common is the name of the bucket. For local storage, the bucketname simply is the name of a directory.

### Local storage
```typescript
const config = {
  bucketName: 'images',
  directory: '/home/user/domains/my-site',
}
const s = new Storage(config); 
```
Files will be stored in `/home/user/domains/my-site/images`.

### Google Cloud
```typescript
const config = {
  bucketName: 'images',
  projectId: 'id-of-your-project',
  keyFilename: 'path/to/json/key-file',
}
const s = new Storage(config); 
```

### Amazon S3
```typescript
const config = {
  bucketName: 'images',
  accessKeyId: 'your-access-key-id',
  secretAccessKey: 'your-amazonaccess-key-secret',
}
const s = new Storage(config); 
```

## API methods

### createBucket
```typescript
createBucket(name?: string): Promise<boolean>;
```
If you omit the name parameter, a new bucket with be created using the name provided in the config object. If the bucket already exists `true` will be returned.

### clearBucket
```typescript
clearBucket(name?: string): Promise<boolean>;
```
Removes all objects in the bucket. If you omit the name parameter, the bucket with the name that was provided with the config object will be cleared.

### addFileFromPath
```typescript
addFileFromPath(filePath: string, args?: StoreFileArgs): Promise<FileMetaData>;
```
Copies a file from a local path to the storage. The `args` object contains the following optional keys:
- `path`: the path to the file in the storage; this allows you to organize your files in subfolders in the bucket
- `newName`: if you want to rename the file this is the new name of the file in the storage
- `remove`: whether or not to remove the file after it has been copied to the storage, defaults to `false`

The promise returns a metadata object that contains the keys `originalName`, `path` and `size`.

```typescript
storage.addFileFromPath('./tests/data/image1.jpg', {
  path: 'subdir/sub subdir/another dir',
  name: 'renamed image.jpg',
  remove: false,
})
.then(data) {
  console.log(data);
}
// prints:
// { origName: 'image1.jpg',
//   size: 103704,
//   path: 'subdir/sub-subdir/another-dir/renamed-image.jpg' }
```

Note that both the path and the name get automatically slugified.

### addFileFromUpload
```typescript
addFileFromUpload(file: Express.Multer.File, args?: StoreFileArgs): Promise<FileMetaData>;
```
Copies a file from the temporary Multer storage to the storage. The `args` object contains the following optional keys:
- `path`: the path to the file in the storage; this allows you to organize your files in subfolders in the bucket
- `newName`: if you want to rename the file this is the new name of the file in the storage
- `remove`: whether or not to remove the file after it has been moved to the storage, defaults to `false`

The promise returns a metadata object that contains the keys `originalName`, `path` and `size`.

### getFileAsReadable
```typescript
getFileAsReadable(name: string): Promise<Readable>;
```
Returns a file as a readable stream.

### removeFile
```typescript
removeFile(name: string): Promise<boolean>;
```
Remove a file (object) from the bucket.

### listFiles
```typescript
listFiles(): Promise<[string, number][]>;
```
Returns a list of all files (objects) in the bucket; for each file a tuple is returned containing the path and the size of the file.

### switchBucket
```typescript
switchBucket(name: string): Promise<boolean>;
```
Switch to another bucket in an existing `Storage` instance at runtime:
```typescript
const config = {
  bucketName: 'images',
  directory: '/home/user/domains/my-site',
}
const s = new Storage(config); 
s.switchBucket('documents');
```
### switchStorage
```typescript
switchStorage(config: StorageConfig): void;
```
Switch to another storage type in an existing `Storage` instance at runtime. The config object is the same type of object that you use to instantiate a storage. This method can be handy if your application needs a view on multiple storages. If your application needs to copy over files (objects) from one storage to another, say for instance from Google Cloud to Amazon S3, then it is more convenient to create 2 separate `Storage` instances.


## How it works

When you create a `Storage` instance you create a thin wrapper around one of these classes:

- `StorageLocal`
- `StorageGoogleCloud`
- `StorageAmazonS3`

Let's call these classes the functional classes because they actually define the functionality of the API methods. The wrapper creates an instance of one of these functional classes based on the provided config object and then forwards every API call to this instance. This is possible because both the wrapper and the functional classes implement the interface `IStorage`. This interface declares all API methods listed above except for the last 2, `switchBucket` and `switchStorage`; these methods are implemented in the `Storage` class. The wrapper itself has hardly any functionality apart from the method `switchStorage`; this method is called by the constructor as well. The method `switchBucket` calls the method `createBucket` on the functional class instance that has been created by the constructor.

The functional classes all extend the class `AbstractStorage`, as you would have guessed this is an abstract class that cannot be instantiated. Its purpose is to implement functionality that can be used across all derived classes; it implements a generic private copy function that is used by the API calls `addFileFromUpload` and `addFileFromPath`. For the rest it contains stub methods for API calls that need a different implementation per storage type and that therefor need to be overruled or extented by the functional subclasses.

If your application doesn't need the methods `switchBucket` and `switchStorage` you can also instantiate a functional class directly:

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

The class names of the functional classes are:

- `StorageGoogleCloud`
- `StorageAmazonS3`
- `StorageLocal`

More functional classes can be added for different storage types, note however that there are many storage vendors that keep their API compliant with Amazon S3.

## Example application

## Tests