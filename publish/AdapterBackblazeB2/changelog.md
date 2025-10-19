# 3.0.0
- version bump to match the version of Storage and the API
- removed support for versioning (wasn't implemented consistently anyway)
- removed `getFileAsURL`
- removed option `{allVersions: boolean}` for `removeFile`
- `removeFile` does not fail if the file doesn't exist
- `deleteBucket` does not fail if the bucket doesn't exist
- see also the [migration guide](https://github.com/tweedegolf/storage-abstraction/blob/master/migration_to_api3.0.md)

# 1.0.7
- include @deprecated functions

# 1.0.6
- implemented new API methods `bucketIsPublic`, `getPublicURL` and `getSignedURL`

# 1.0.5
- fix bug in selected bucket

# 1.0.3
- revert to v1 format of config URLs
- re-implement storing the selected bucket in local state
  - `selectBucket` and `geSelectedBucket`
  - also implemented as getter
    `storage.bucketName = "the-buck";` and setter `console.log(storage.bucketName);`
