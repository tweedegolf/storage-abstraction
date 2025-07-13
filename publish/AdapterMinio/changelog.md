# 1.0.11

- update minio npm package to 8.0.5

# 1.0.10

- update minio npm package to 8.0.0
- add support for optional key `useSignedUrl` in options object `getFileAsUrl`

# 1.0.9

- fix bug in selected bucket

# 1.0.7

- revert to v1 format of config URLs
- re-implement storing the selected bucket in local state
  - `selectBucket` and `geSelectedBucket`
  - also implemented as getter
    `storage.bucketName = "the-buck";` and setter `console.log(storage.bucketName);`
