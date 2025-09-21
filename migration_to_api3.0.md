### Versioning



### createBucket

`createBucket(bucketName, {public: true})` creates a public bucket if possible. Cloudflare and Backblaze don't support creating a public bucket with the S3 API; the bucket will be created but you have to manually make the bucket public using their web console. The call won't fail but it will yield a warning:
 ```
 "Bucket '${bucketName}' created successfully but you can only make this bucket public using the ${cloudService} web console"
 ```

### removeFile
removed the option `{allVersions: boolean}` from `removeFile`

### deleteBucket
If you delete the bucket that was selected, `selectedBucket` will be set to `null`

### getFileAsURL
Removed, use `getPublicURL` or `getSignedURL` 

### addFile
All `addFile` methods do not return the url to the added file anymore. They simply return "ok" if the file was added successfully.

### removeFile
Now yields an error if the file doesn't exist. Also yields an error if the bucket doesn't exist. This is implemented because when you try to remove a non-existent file in Backblaze B2 using the S3 adapter, it will create a hidden file.

### selectedBucket
If your config contains a bucket name, it will be set as the selected bucket but it won't be created if it doesn't exist.

### clearBucket()
Now always removes all versions



