# 1.0.8

- fixed gcs signed url generation

# 1.0.7

- updated @google-cloud/storage to 7.11.1
- add support for optional key `useSignedUrl` in options object `getFileAsUrl`

# 1.0.6

- updated @google-cloud/storage to 7.9.0

# 1.0.5

- fix bug in selected bucket

# 1.0.3

- revert to v1 format of config URLs
- re-implement storing the selected bucket in local state
  - `selectBucket` and `geSelectedBucket`
  - also implemented as getter
    `storage.bucketName = "the-buck";` and setter `console.log(storage.bucketName);`
