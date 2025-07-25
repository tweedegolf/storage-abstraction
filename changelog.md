# 2.2.0

- updated dependencies of adapters
- deprecated `getFileAsURL`
- added `getPublicURL` and `getPresignedURL`
- added `bucketIsPublic`
- added extra key to the options object of all `addFile` functions:  `useSignedURL` (boolean) &rarr; returns the presigned url instead of the public url when set to `true`
- added extra key to the options object of `createBucket`:  `public` (boolean) &rarr; creates a public bucket when set to `true`
- you can call `createBucket` without providing a bucket name. If a bucket name is selected, either in the initialization configuration of by setting one using `setSelectedBucket`, a bucket with that name will be created. If the selected bucket is null, an error will be returned.

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

# 1.5.6

- removed unnecessary call to getMetaData in GCS adapter
- removed @ramda/zip dependency

# 1.5.5

- changed Backblaze B2 service client dependency to a [fork](https://www.npmjs.com/package/@nichoth/backblaze-b2) that fixes the long standing Axios security issue &rarr; all credits: [nichoth](https://github.com/nichoth)

# 1.5.4

- added `getFileAsURL` to Amazon S3 adapter &rarr; all credits: [DennisSnijder](https://github.com/DennisSnijder)

# 1.5.3

- fix for issue #48 &rarr; all credits: [Pezmc](https://github.com/Pezmc)

# 1.4.7 - 1.5.2

- Added support for Azure &rarr; all credits: [tesirm99](https://github.com/tesirm99)
- Upgrade all packages
- Fixed numerous async errors
- AdapterAmazonS3: use `s3-request-presigner` to create links to objects
- AdapterAmazonS3: added support for S3 compatible storages (tested with Cloudflare R2 and Backblaze S3)
- AdapterLocal now treats values without prefix passed to `mode` as decimal number instead of octal numbers
- AdapterLocal: if you pass the config as an object and you don't provide a value for `bucketName`, the bucketName will no longer be set to the last folder of the value you provide for `directory`. In other words: if you want to set a value for `bucketName` you have to add it specifically to the config object.

# 1.4.5

- Remove option 'slug' in config: this makes the user responsible for choosing a valid bucket name.
- Add `options` to `createBucket`.
- Add `options` to `addFileFromPath`, `addFileFromBuffer` and `addFileFromReadable`.
- Add `skipCheck` to configuration object and made all keys optional
- Return public url after a file has been successfully added to a bucket

# 1.4.4

- use '@aws-sdk/client-s3' instead of 'aws-sdk'
- eslint fixes

# 1.4.3

- Removed `await-to-js` dependency in local storage adapter

# 1.4.2

- Added `ConfigAmazonS3`, `ConfigBackblazeB2`, `ConfigGoogleCloud` and `ConfigLocal` to exported types
- Removed `await-to-js` dependency

# 1.4.1

- Added `AdapterConfig` to exported types

# 1.4.0

- Changed the name of the 'functional classes' from Storage to Adapter, e.g. `StorageAmazonS3` became `AdapterAmazonS3`
- Replaced `introspect()` by `getConfiguration():AdapterConfig` and `getType():string`
- Added adapter class for BackBlaze B2
- Made configuration more generic and extensible
- Removed option to create a new Storage without configuration (StorageLocal)
- Added default storage options that can be overruled or extended by the config object or url
- Made slugify optional and turned it off by default for StorageLocal
- Added API method `fileExists():Promise<boolean>`
- In the configuration object or string non-existent keys or invalid values are no longer filtered out: it is the programmer's responsibility to provide valid options
- If no bucket name is provided the bucket name will always be an empty string "", not `undefined` or `null`. Also when no bucket is selected `bucketName` will be "".
- Adapter modules are only loaded when needed (using `require`)
- Removed options from both configuration and adapters.
- Formalized return values

# 1.3.1

- Removed sloppy code: parsing and validation of configuration is now done in one [place](https://github.com/tweedegolf/storage-abstraction/blob/master/src/util.ts).
- Removed jasmine-ts dependency

# 1.3.0

- Removed `getFileByteRangeAsReadable` and merged the functionality in `getFileAsReadable` by adding a range parameter `{start: number, end: number}`
- Removed the option to instantiate a specific storage type directly; all instantiating must be done with `new Storage(config)`.
- Optimized `getFileAsReadable` for Google Cloud.
- Implemented `addFileFromReadable`, fixes [issue#2](https://github.com/tweedegolf/storage-abstraction/issues/2)
- Added configuration urls: all configuration options in a single string.
- When creating a local storage without specifying a directory, the directory where the process runs will be used (in earlier versions the os' tmp folder was used)
- When creating a local storage without specifying a bucket name, a directory named `local-bucket` will be created and used as selected bucket.
- When using `new Storage()` without configuration you create a local storage instance with the default configuration (as described in the 2 bullets above).
- Updated documentation.
- Updated dependency version.
- Added yarn.lock.
- Renamed 'functional classes' to 'adapter classes'

# 1.2.1

(Pull request #3)[https://github.com/tweedegolf/storage-abstraction/pull/3]

- Implemented `sizeOf`, `getFileByteRangeAsReadable`
- Improved AWS performance

# 1.1.16

(Pull request #1)[https://github.com/tweedegolf/storage-abstraction/pull/1]

- Expanded the S3 configuration options
