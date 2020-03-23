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
- When using `new Storage()` without configuration a local storage instance will be created that creates a folder called `local-bucket` in the os' tmp folder and uses this folder as its selected bucket.
- Updated documentation.
- Updated dependency version.
- Added yarn.lock.
