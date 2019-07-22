# Storage Abstraction

Provides an API for storing and retrieving files from a storage; this storage can be a local file system or a cloud storage. For cloud storage currently Google Cloud and Amazon S3 and compliant cloud services are supported.

<a name="instantiate-a-storage"></a> 

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

### test
```typescript
test():Promise<void>;
```

Runs a simple test to test the storage configuration: calls `listBuckets` only to check if it fails and if so, it throws an error.

### createBucket
```typescript
createBucket(name: string): Promise<void>;
```
Creates a new bucket, does not fail if the bucket already exists.

### selectBucket
```typescript
selectBucket(name: string | null): Promise<void>;
```
Select another bucket for storing files, the bucket will be created automatically if it doesn't exist.If you pass `null` the currently selected bucket will be deselected.

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
Copies a file from a local path to the provided path in the storage. The value for `targetPath` needs to include at least a file name plus extension; the value will be slugified automatically.

### addFileFromBuffer
```typescript
addFileFromUpload(buffer: Buffer, targetPath: string): Promise<void>;
```
Copies a buffer to a file in the storage. The value for `targetPath` needs to include at least a file name plus extension; the value will be slugified automatically. This method is particularly handy when you want to move uploaded files to the storage, for instance when you use Express.Multer with DiskStorage.

### getFileAsReadable
```typescript
getFileAsReadable(name: string): Promise<Readable>;
```
Returns a file in the storage as a readable stream.

### removeFile
```typescript
removeFile(name: string): Promise<void>;
```
Removes a file from the bucket. Does not fail if the file didn't exist.

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

```npm run test-jasmine```

You can run tests per storage type using on of these commands, see also the file `package.json`:

```bash
# test local disk
npm run test-local
# test google storage
npm run test-google
# test amazon s3
npm run test-amazon
```

You can find some additional non-Jasmine tests in the file `tests/test.ts`. You can test a single type of storage or run all tests, just open the file and uncomment you want to run and:

```npm test```

## Example application

In the `example` folder you'll find a simple application that shows how you can use the storage abstraction package. It uses and TsED and TypeORM and it consists of both a backend and a frontend. 

```bash
cd ./example

# install dependencies
docker-compose run backend npm i

# start both frontend and backend server
docker-compose up
```
Now the application should be available at <https://localhost> (make sure you've stopped any local process that use port 80 or set a different port in the `docker-compose.yaml` file).

### Frontend

The frontend shows a listing of images. You can:

- Upload new images to the storage (multiple file upload is supported)
- View a full-screen version of the image by clicking on the thumbnail
- Remove images from the storage

You can create new buckets or delete buckets in the storage as well. Also you can switch between different storages if you have added multiple storage configurations to the backend configuration.

### Backend

The backend provides an API that the frontend can talk to. It created thumbnails from the uploaded images and it maintains a connection to the selected or configured storage:

- Add and delete the images to the storage
- Create, select and remove buckets in the storage

The backend also stores some metadata of the uploaded images in a Postgres database:

- file-size
- original filename
- path (including the filename) of the file in the storage
- date created
- date updated

This data is (partly) used to populate the file list at the frontend.

### Configuration of the backend

You can use the local storage type without any configuration but to be able to use the Google Cloud and Amazon S3 storage types you need provide some credentials, see the documentation on this here: [Google](https://cloud.google.com/storage/docs/) and [Amazon](https://aws.amazon.com/s3/). In both cases you need to create an account first.

In the example the credentials are read as environment variables. You can use the file `.env.default` as a starting point for your creating your own `.env` file. Note that you may change the names of the environment variables to your liking, the only concern is that after you've changed them in the `.env` file you have to change them in the code as well.

In the constructor of [`MediaFileService`](https://github.com/tweedegolf/storage-abstraction/blob/master/example/backend/src/services/MediaFileService.ts) the storage configurations are read from the environment variables. In this example 4 different storage configurations are added to the backend and on line 65 an instance of `Storage` gets created using the first configurations. 

In the method `getInitData` a list of the ids of the storage configurations is sent to the frontend where it populates a dropdown menu that allows the user to quickly switch between the configured storages. If you have added only 1 storage configuration the dropdown menu is not shown. 

If a default storage configuration is set, `getInitData` also sends a list of buckets in that storage and if a default bucket is set a list of files is sent along as well. The list of files gets added to the init data in the [`StorageController`](https://github.com/tweedegolf/storage-abstraction/blob/master/example/backend/src/controllers/StorageController.ts#L21). From here the method `synchronize` on the `MediaFileService` is called to synchronize the content of the database with the content of the bucket. The content of the bucket is leading.

### Basic setup

The example aims to show all functionality of the storage abstraction package but in most cases you probable need only one single bucket in one single storage. Then you can simply instantiate a storage and provide a bucket name in the config as described [above](#instantiate-a-storage).

## Questions and requests

Please let us know if you have any questions and/or request by filing an issue on [Github](https://github.com/tweedegolf/storage-abstraction/issues)
