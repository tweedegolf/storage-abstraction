# Storage Abstraction

Provides an API for storing and retrieving files from a storage; this storage can be local or in the cloud. Cloud storage: currently Google Cloud and Amazon S3 and complient cloud services are supported.

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

```typescript
storage.addFileFromPath('./tests/data/image1.jpg', {
  path: 'subdir/sub-subdir/another-dir',
  name: 'renamed.jpg',
  remove: false,
})
```

### addFileFromUpload
```typescript
addFileFromUpload(file: Express.Multer.File, args?: StoreFileArgs): Promise<FileMetaData>;
```
Copies a file from the temporary Multer storage to the storage. The `args` object contains the following optional keys:
- `path`: the path to the file in the storage; this allows you to organize your files in subfolders in the bucket
- `newName`: if you want to rename the file this is the new name of the file in the storage
- `remove`: whether or not to remove the file after it has been moved to the storage, defaults to `false`

### getFileAsReadable
```typescript
getFileAsReadable(name: string): Promise<Readable>;
```
Returns a file as a readable stream

### removeFile
```typescript
removeFile(name: string): Promise<boolean>;
```
Remove a file (object) from the bucket

### listFiles
```typescript
listFiles(): Promise<[string, number][]>;
```
Returns a list of all files (objects) in the bucket; for each file a tuple is returned containing the path and the size of the file.