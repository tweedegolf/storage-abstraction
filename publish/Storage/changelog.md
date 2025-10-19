# 3.0.0
- new API version 3.0
- removed support for versioning (wasn't implemented consistently anyway)
- removed `getFileAsURL`
- removed option `{allVersions: boolean}` for `removeFile`
- `removeFile` does not fail if the file doesn't exist
- `deleteBucket` does not fail if the bucket doesn't exist
- see also the [migration guide](https://github.com/tweedegolf/storage-abstraction/blob/master/migration_to_api3.0.md)

# 2.2.1
- include @deprecated functions

# 2.2.0
- implemented new API methods `bucketIsPublic`, `getPublicURL` and `getSignedURL`
- fixed several unnoticed bugs

# 2.1.6
- updated Google AzureBlob adapter to 1.0.7

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
