# 1.0.18
- update @aws-sdk to 3.832.0
- add check: if you use the Amazon adapter to connect to Cloudflare R2 `getFileAsUrl`, `addFileFromPath`, `addFileFromBuffer` and `addFileFromStream` return a signed url regardless whether `useSignedURL` is false or true. See [issue #72](https://github.com/tweedegolf/storage-abstraction/issues/72). 
- implemented new API methods `bucketIsPublic`, `getPublicURL` and `getSignedURL`

# 1.0.17
- add support for optional key `useSignedUrl` in options object `getFileAsUrl`

# 1.0.16
- updated @aws-sdk to 3.582.0

# 1.0.15
- updated @aws-sdk to 3.550.0

# 1.0.14
- fix for issue #60
- updated @aws-sdk to 3.525.0

# 1.0.13
- improved error logging

# 1.0.12
- fix bug in selected bucket

# 1.0.10
- revert to v1 format of config URLs
- re-implement storing the selected bucket in local state
  - `selectBucket` and `geSelectedBucket`
  - also implemented as getter
    `storage.bucketName = "the-buck";` and setter `console.log(storage.bucketName);`
- update @aws-sdk/client-s3 to 3.503.1
