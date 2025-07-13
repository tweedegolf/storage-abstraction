# 1.0.8

- update glob to 11.0.3
- update rimraf to 6.0.1

# 1.0.7

- add support for urls (paths) without containing directory (credits: https://github.com/tesirm99)

# 1.0.6

- small cosmetic code changes (no change in functionality)
- updated glob to 10.3.12

# 1.0.5

- fix bug in selected bucket

# 1.0.3

- revert to v1 format of config URLs
- re-implement storing the selected bucket in local state
  - `selectBucket` and `geSelectedBucket`
  - also implemented as getter
    `storage.bucketName = "the-buck";` and setter `console.log(storage.bucketName);`
