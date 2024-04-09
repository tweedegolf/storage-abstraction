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
