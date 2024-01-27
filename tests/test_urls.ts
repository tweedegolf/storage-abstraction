import { parseUrl } from "../src/util";
import { parseUrlStandard } from "../src/util";

const urls = [
  "local://path/to/bucket@bucket_name?mode=511&extra_option2=value2",
  "s3://access_key_id:secret_access_key@bucket_name?region=region&extra_option2=value2",
  "s3://@bucket_name?region=region&extra_option2=value2",
  "s3://@bucket_name",
  "s3://",
  // "s3",
  "s3://@bucket_name?extra_option1=value1&extra_option2=value2",
  "gcs://path/to/key_file.json@bucket_name?extra_option1=value1&extra_option2=value2",
  "b2://application_key_id:application_key@bucket_name?extra_option1=value1&extra_option2=value2",
  "b2://application_key_id:application_key@bucket_name",
  "azure://account_name:account_key@container_name?extra_option1=value1&extra_option2=value2",
  "azure://account_name@container_name",
  "azure://account_name@container_name?sas_token=SAS_TOKEN",
  "azure://account_name@container_name?connection_string=CONNECTION_STRING&extra_option2=value2",
  "minio://access_key:secret_key@bucket_name?region=region&endPoint=END_POINT&port=PORT&useSSL=USE_SSL",
  "minio://accessKey:secretKey@bucket_name?endPoint=END_POINT",
  "minio://accessKey:secretKey@bucket_name:9000?endPoint=END_POINT",
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
console.log(parseUrl("minio://accessKey:secretKey@the-buck:9000?endPoint=END_POINT"));
console.log(parseUrl("minio://@the-buck:9000?endPoint=END_POINT"));
console.log(parseUrl("minio://@the-buck?endPoint=END_POINT"));
console.log(parseUrl("minio://@the-buck:9000"));
console.log(parseUrl("minio://@the-buck"));

// console.log(parseUrlStandard("minio://accessKey:secretKey@:9000?endPoint=END_POINT"));
