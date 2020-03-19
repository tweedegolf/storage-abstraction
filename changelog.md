# 1.1.16

(Pull request #1)[https://github.com/tweedegolf/storage-abstraction/pull/1]

- Expanded the S3 configuration options

# 1.2.1

(Pull request #3)[https://github.com/tweedegolf/storage-abstraction/pull/3]

- Implemented sizeOf, getFileByteRangeAsReadable
- Improved AWS performance

# 1.3.0

- Merged `getFileByteRangeAsReadable` in `getFileAsReadable` by adding a range parameter
- Removed option to instantiate a specific storage type; all instantiating must be done with `new Storage(config)`.
- Optimized `getFileAsReadable` for Google Cloud
- Implemented `addFileFromReadable`
- Added config urls
