# 3.0.4

- add checkIfBucketExists option in getFileAsStream

# 3.0.3

- added option `checkIfBucketExists` to the `addFile`, `addFileFromPath`, `addFileFromBuffer` and `addFileFromStream`

# 3.0.2

- fix links in README toc

# 3.0.1

- fix layout issue in README toc

# 3.0.0

- new API version 3.0
- removed support for versioning (wasn't implemented consistently anyway)
- removed `getFileAsURL`
- removed option `{allVersions: boolean}` for `removeFile`
- `removeFile` does not fail if the file doesn't exist
- `deleteBucket` does not fail if the bucket doesn't exist
- see also the [migration guide](https://github.com/tweedegolf/storage-abstraction/blob/master/migration_to_api3.0.md)

# 2.2.1

- updated dependencies of adapters
- deprecated `getFileAsURL`
- added `getPublicURL` and `getSignedURL`
- added `bucketIsPublic` (does not work for CloudFlare and Cubbit)
- added extra key to the options object of all `addFile` functions: `useSignedURL` (boolean) &rarr; returns the presigned url instead of the public url when set to `true`
- added extra key to the options object of `createBucket`:  `public` (boolean) &rarr; creates a public bucket when set to `true`
- you can call `createBucket` without providing a bucket name. If a bucket name is selected, either in the initialization configuration of by setting one using `setSelectedBucket`, a bucket with that name will be created. If the selected bucket is null, an error will be returned.
- fix: if you delete the selected bucket, the selected bucket will be set to `null`
- fix: include @deprecated functions


# 2.2.0

- implemented new API methods `bucketIsPublic`, `getPublicURL` and `getSignedURL`
- fixed several unnoticed bugs

# 2.1.6

- update Google AzureBlob adapter to 1.0.7
- update dependencies

# 2.1.5

- updated Google Cloud adapter to 1.0.8

# 2.1.4

- updated dependencies
- remarkable dependency autolinker set to "^4.0.0"

# 2.1.3

- updated dependencies

# 2.1.2

- updated dependencies
- fixed test scripts
- fix for type error in @types/glob

# 2.1.1

- fix issue with optional `bucketName` argument

# 2.1.0

- reverted to v1 of the configuration URLs (with some improvements)
- re-implemented storing the selected bucket in local state

# 2.0.0

- Complete overhaul of the API. If you are using API 1.x please read the [migration document](migration_to_api2.1.md)

# 1.5.6

- removed unnecessary call to getMetaData in GCS adapter
- removed @ramda/zip dependency
