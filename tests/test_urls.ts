import { parseUrl2 } from "../src/util";

const urls = [
  "local://path/to/bucket@bucket_name?mode=511&extra_option2=value2",
  "s3://access_key_id:secret_access_key@bucket_name?region=region&extra_option2=value2",
  "s3://@bucket_name?region=region&extra_option2=value2",
  "s3://@bucket_name",
  "s3://@bucket_name?extra_option1=value1&extra_option2=value2",
  "gcs://path/to/key_file.json@bucket_name?extra_option1=value1&extra_option2=value2",
  "b2://application_key_id:application_key@bucket_name?extra_option1=value1&extra_option2=value2",
  "b2://application_key_id:application_key@bucket_name",
];

urls.forEach((u: string) => {
  const r = parseUrl2(u);
  console.log(u);
  console.log(r);
});
