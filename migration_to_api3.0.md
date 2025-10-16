### Provider

`StorageType` has been refactored to `Provider` and you can now specify which S3 compatible provider you want to connect to. This is done because the various S3 compatible providers differ quite a lot in how the S3 API has been implemented.

```typescript
export enum Provider {
  NONE = "none",          // initial value for the abstract adapter
  LOCAL = "local",
  GCS = "gcs",            // Google Cloud Storage
  GS = "gs",              // Google Cloud Storage
  S3 = "s3",              // Amazon S3 and S3 compatible providers Cubbit, Cloudflare, Minio and Backblaze
  AWS = "aws",            // Amazon S3 (only Amazon or providers that are fully S3 compatible)
  B2 = "b2",              // BackBlaze B2 using native API
  BACKBLAZE = "b2",       // BackBlaze B2 using native API
  AZURE = "azure",        // Azure Storage Blob
  MINIO = "minio",        // Minio using native API
  MINIO_S3 = "minio-s3",  // Minio using S3 API
  B2_S3 = "b2-s3",        // Backblaze using S3 API
  BACKBLAZE_S3 = "b2-s3", // Backblaze using S3 API
  CUBBIT = "cubbit",      // Cubbit uses S3 API
  R2 = "r2",              // Cloudflare R2 uses S3 API
  CLOUDFLARE = "r2",      // Cloudflare R2 uses S3 API  
}
```
>[!NOTE]
>`Provider.S3` and `Provider.AWS` are different adapters!
>`Provider.S3` supports Amazon S3 and the loose compatible S3 cloud providers Backblaze, Cloudflare, Cubbit and Minio
>`Provider.AWS` only supports Amazon S3 and strict compatible S3 cloud providers

The adapter `AdapterAmazonS3` has been renamed to `AdapterS3` because it supports multiple implementations of the S3 API. The code of `AdapterS3` is merely the same as the original `AdapterAmazonS3`.

In the code of `AdapterAmazonS3` all if-else forking that was necessary to support all different S3 implementations has been removed. Therefor this adapter now only supports Amazon S3 and providers that are fully compatible with S3.

We decided to keep `AdapterS3` for historical reasons; originally we tried to create a single adapter for all S3 compatible providers but unfortunately the implementation of S3 differs quite across 'compatible' providers which led to a lot of if-else forking in the code making it hard to read and maintain. 

Therefor we decided to write one adapter with a strict Amazon S3 implementation and then write a separate adapter for every S3 compatible provider, extending the Amazon S3 adapter and overriding methods that had to be implemented differently. So far this has lead to 4 new adapters that extend the strict Amazon S3 adapter:

- AdapterBackblazeS3
- AdapterCloudflareS3
- AdapterCubbitS3
- AdapterMinioS3


### Versioning

In earlier versions object versioning wasn't implemented in a consistent way. This is because versioning is implemented differently across the support cloud storage platforms. Backblaze B2 uses a form of versioning that cannot be turned off and Azure Blob Storage you cannot enable versioning using the SDK (read the [documentation](https://learn.microsoft.com/en-us/azure/storage/blobs/versioning-enable?tabs=template#enable-blob-versioning) if you want to know how you can enable versioning on a Azure Blob container). Therefor we have decided to remove the support for versioning altogether. Let us know if you disagree or if this decision causes you trouble.

### createBucket
Removed the option `{versioning: boolean}`. 

`createBucket(bucketName, {public: true})` creates a public bucket if possible. Cloudflare and Backblaze don't support creating a public bucket with the S3 API; the bucket will be created but you have to manually make the bucket public using their web console. The call won't fail but it will yield a warning:
 ```
 "Bucket '${bucketName}' created successfully but you can only make this bucket public using the ${cloudService} web console"
 ```

### deleteBucket
If you delete the bucket that was selected, `selectedBucket` will be set to `null`.

Does not fail if the bucket doesn't exist but returns a message `No bucket '${bucketName}' found.`

### getFileAsURL
Removed, use `getPublicURL` or `getSignedURL` 

### addFile
All `addFile` methods do not return the url to the added file anymore. They simply return "ok" if the file was added successfully.

### removeFile
Doesn't fail if the file doesn't exist but immediately returns a message: `No file '${fileName}' found in bucket '${bucketName}'`

If the bucket doesn't exist it fails and returns an error. 

This is implemented because if you try to remove a non-existent file in Backblaze B2 using the S3 adapter, it will create a hidden file (which probably is a bug at Backblaze).

Removed the option `{allVersions: boolean}` from `removeFile`

### selectedBucket
If your config contains a bucket name, it will be set as the selected bucket but it won't be created if it doesn't exist.

### clearBucket()
Now always removes all versions (Backblaze versioning can't be turned off, see above)



