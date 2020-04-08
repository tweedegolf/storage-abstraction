# 1.1.16

(Pull request #1)[https://github.com/tweedegolf/storage-abstraction/pull/1]

- Expanded the S3 configuration options

# 1.2.1

(Pull request #3)[https://github.com/tweedegolf/storage-abstraction/pull/3]

- Implemented `sizeOf`, `getFileByteRangeAsReadable`
- Improved AWS performance

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

# 1.3.1

- Removed sloppy code: parsing and validation of configuration is now done in one [place](https://github.com/tweedegolf/storage-abstraction/blob/master/src/util.ts).
- Removed jasmine-ts dependency

# 1.4.0

- Replaced `introspect()` by `getConfiguration():StorageConfig`, `getOptions():JSON` and `getType():string`
- Added adapter class for BackBlaze B2
- Made configuration is more strict and generic
- Removed option to create a new Storage without configuration (StorageLocal)
- Added default storage options that can be overruled or extended by the options in the config object or url
- Made slugify optional and turned it off by default on StorageLocal
- Added API method `fileExists():Promise<boolean>`
