import dotenv from "dotenv";
import { parseUrl } from "../src/util.ts";
import { parseUrlStandard } from "../src/util.ts";

dotenv.config();

const urls = [
  "local://path/to/bucket@bucket_name?mode=511&extra_option2=value2",

  "aws://access_key_id:secret_access_key@bucket_name?region=region&extra_option2=value2",
  "s3://access_key_id:secret_access_key@bucket_name?region=region&extra_option2=value2",
  "s3://@bucket_name?region=region&extra_option2=value2",
  "s3://@bucket_name",
  "s3://",
  // "s3",
  "s3://@bucket_name?extra_option1=value1&extra_option2=value2",

  "gs://path/to/key_file.json@bucket_name?extra_option1=value1&extra_option2=value2",
  "gcs://path/to/key_file.json@bucket_name?extra_option1=value1&extra_option2=value2",

  "b2://application_key_id:application_key@bucket_name?extra_option1=value1&extra_option2=value2",
  "backblaze://application_key_id:application_key@bucket_name",
  "b2-s3://access_key_id:secret_access_key@bucket_name?region=region",

  "azure://account_name:account_key@container_name?extra_option1=value1&extra_option2=value2",
  "azure://account_name@container_name",
  "azure://account_name@container_name?sas_token=SAS_TOKEN",
  "azure://account_name@container_name?connection_string=CONNECTION_STRING&extra_option2=value2",

  "minio://access_key:secret_key@bucket_name?region=region&endPoint=END_POINT&port=PORT&useSSL=USE_SSL",
  "minio://accessKey:secretKey@bucket_name?endPoint=END_POINT",
  "minio://accessKey:secretKey@bucket_name:9000?endPoint=END_POINT",
  "minio-s3://access_key_id:secret_access_key@bucket_name?region=region&endPoint=http://localhost:9000",
];

// urls.forEach((u: string) => {
//   const r = parseUrl(u);
//   console.log(u);
//   console.log(r);
// });

// console.log(parseUrl("minio://accessKey:secretKey@bucket_name:9000?endPoint=END_POINT"));

// console.log(parseUrlStandard("minio://accessKey:secretKey@bucket_name:9000?endPoint=END_POINT"));

// console.log(parseUrl("minio://accessKey:secretKey:9000?endPoint=END_POINT"));
// console.log(parseUrl("minio://accessKey:secretKey@:9000?endPoint=END_POINT"));
// console.log(parseUrl("minio://accessKey:secretKey@the-buck:9000?endPoint=END_POINT"));
// console.log(parseUrl("minio://@the-buck:9000?endPoint=END_POINT"));
// console.log(parseUrl("minio://@the-buck?endPoint=END_POINT"));
// console.log(parseUrl("minio://@the-buck:9000"));
// console.log(parseUrl("minio://@the-buck"));

// console.log(parseUrlStandard("minio://accessKey:secretKey@:9000?endPoint=END_POINT"));

// port and bucket
const u1 = "protocol://part1:part2@bucket:port/path/to/object?region=auto&option2=value2";

// no bucket but with @
const u2 = "protocol://part1:part2@:port/path/to/object?region=auto&option2=value2";

// no bucket
const u3 = "protocol://part1:part2:port/path/to/object?region=auto&option2=value2";

// no credentials, note: @ is mandatory in order to be able to parse the bucket name
const u4 = "protocol://@bucket/path/to/object?region=auto&option2=value2";

// no credentials, no bucket
const u5 = "protocol:///path/to/object?region=auto&option2=value2";

// no credentials, no bucket, no extra options (query string)
const u6 = "protocol:///path/to/object";

// only protocol
const u7 = "protocol://";

// bare
const u8 = "protocol";

[u1, u2, u3, u4, u5, u6, u7, u8, ...urls].forEach((u: string) => {
  const r = parseUrl(u);
  console.log(u);
  console.log(r);
});

// const u10 = `r2://${process.env.R2_ACCESS_KEY_ID}:${process.env.R2_SECRET_ACCESS_KEY}@${process.env.BUCKET_NAME}/path/to?endpoint=${process.env.R2_ENDPOINT}&region=${process.env.R2_REGION}`
// const r = parseUrl(u10);
// console.log(r)

// console.log(parseUrl("minio://your-access-key:your-secret-key@the-buck:9000"));
// console.log(parseUrl("minio://your-access-key:your-secret-key@the-buck?port=9000"));
