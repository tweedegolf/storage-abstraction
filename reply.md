Sorry my late reply... Yes, you are right, this is a flaw. In fact there is no need for a function that returns the public url because you can construct the url by composing the data that is already available.

When using Amazon S3:
`https://${bucket-name}.s3.${region}.amazonaws.com/${object-key}`

When using Cloudflare R2:
`https://<bucket-name>.<account-id>.r2.dev/<object-key>`

So maybe it is best to rename `getFileAsUrl()` to `getSignedUrl()`. Although the local adapter doesn't have this method.
