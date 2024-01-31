### Local storage

```typescript
const url = "local://path/to/bucket@bucket_name?mode=511&extra_option2=value2...";

const config: AdapterConfigLocal = {
  bucketName: "bucket_name",
  directory: "path/to/bucket",
  mode: "511",
};
```

### Amazon S3

```typescript
const url =
  "s3://access_key_id:secret_access_key@bucket_name?region=region&extra_option2=value2...";

const config: AdapterConfigAmazonS3 = {
  bucketName: "bucket_name",
  accessKeyId: "access_key_id",
  secretAccessKey: "secret_access_key",
  region: "region",
};

// read accessKeyId and secretAccessKey from environment
const url = "s3://@bucket_name?region=region&extra_option2=value2...";

const config: AdapterConfigAmazonS3 = {
  bucketName: "bucket_name",
  region: "region",
};

// read accessKeyId, secretAccessKey and region from environment
const url = "s3://@bucket_name?extra_option1=value1&extra_option2=value2...";

const config: AdapterConfigAmazonS3 = {
  bucketName: "bucket_name",
};
```

### Google Cloud Storage

```typescript
const url = "gcs://path/to/key_file.json@bucket_name?extra_option1=value1&extra_option2=value2...";

const config: AdapterConfigGoogleCloud = {
  bucketName: "bucket_name",
  keyFilename: "path/to/key_file.json",
};

// read path to keyFile.json from environment
const url = "gcs://@bucket_name?extra_option1=value1&extra_option2=value2...";
const config: AdapterConfigGoogleCloud = {
  bucketName: "bucket_name",
};
```

### Backblaze B2

```typescript
const url =
  "b2://application_key_id:application_key@bucket_name?extra_option1=value1&extra_option2=value2...";

const config: AdapterConfigBackblazeB2 = {
  bucketName: "bucket_name",
  applicationKeyId: "application_key_id",
  applicationKey: "application_key",
};
```

### Azure Blob Storage

```typescript
// both accountName and accountKey
const url =
  "azure://account_name:account_key@container_name?extra_option1=value1&extra_option2=value2...";

const config: AdapterConfigAzureBlob = {
  bucketName: "container_name",
  accountName: "account_name",
  accountKey: "account_key",
};

// passwordless
const url = "azure://account_name@container_name?extra_option1=value1&extra_option2=value2...";

const config: AdapterConfigAzureBlob = {
  bucketName: "container_name",
  accountName: "account_name",
};

// sasToken
const url = "azure://account_name@container_name?sas_token=SAS_TOKEN&extra_option2=value2...";

const config: AdapterConfigAzureBlob = {
  bucketName: "container_name",
  accountName: "account_name",
  sasToken: "SAS_TOKEN",
};

// connection string
const url =
  "azure://account_name@container_name?connection_string=CONNECTION_STRING&extra_option2=value2...";

const config: AdapterConfigAzureBlob = {
  bucketName: "container_name",
  accountName: "account_name",
  connectionString: "CONNECTION_STRING",
};
```

### MinIO

```typescript
const url =
  "minio://access_key:secret_key@bucket_name?region=region&endPoint=END_POINT&port=PORT&useSSL=USE_SSL";

const config: AdapterConfigMinio = {
  bucketName: "bucket_name",
  accessKey: "access_key",
  secretKey: "secret_key",
  endPoint: "END_POINT",
  region: "region",
  useSSL: "USE_SSL",
  port: "PORT",
};

// without region, defaults to "auto"
const url = "minio://accessKey:secretKey@bucket_name?endPoint=END_POINT&port=PORT&useSSL=USE_SSL";

const config: AdapterConfigMinio = {
  bucketName: "bucket_name",
  accessKey: "access_key",
  secretKey: "secret_key",
  endPoint: "END_POINT",
  useSSL: "USE_SSL",
  port: "PORT",
};

// without region, port and useSSL, will default to "auto", "443" and "true"
const url = "minio://accessKey:secretKey@bucket_name?endPoint=END_POINT";

const config: AdapterConfigMinio = {
  bucketName: "bucket_name",
  accessKey: "access_key",
  secretKey: "secret_key",
  endPoint: "END_POINT",
};
```
