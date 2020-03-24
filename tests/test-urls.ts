import { Storage } from "../src/Storage";

const urlsGoogle = [
  "gcs://keyFile.json:appName/the-buck",
  "gcs://keyFile.json:appName/",
  "gcs://keyFile.json:appName",
  "gcs://tests/keyFile.json/the-buck",
  "gcs://tests/keyFile.json/",
  "gcs://keyFile.json",
];

const urlsAmazon = [
  "s3://key:secret/can/contain/slashes",
  "s3://key:secret/can/contain/slashes?region=eu-west-2&bucketName=the-buck&sslEnabled=true",
  "s3://key:secret/can/contain/slashes?buckeName=the-buck",
  "s3://key:secret/can/contain/slashes?region=eu-west-2&bucketName=the-buck&sslEnabled=true&useDualstack=23&nonExistentKey=true",
  "s3://key:secret/can/contain/slashes@eu-west-2/the-buck?sslEnabled=true&endpoint=https://kms-fips.us-west-2.amazonaws.com",
  "s3://key:secret/can/contain/slashes@/the-buck?sslEnabled=true&endpoint=https://kms-fips.us-west-2.amazonaws.com",
  "s3://key:secret/can/contain/slashes@the-buck?sslEnabled=true&endpoint=https://kms-fips.us-west-2.amazonaws.com", // error!
  "s3://key:secret/can/contain/slashes/the-buck?sslEnabled=true&endpoint=https://kms-fips.us-west-2.amazonaws.com", // error!
  "s3://key:secret/can/contain/slashes@us-east-1/not-here?region=eu-west-2&bucketName=the-buck&sslEnabled=true&useDualstack=23&nonExistentKey=true&endpoint=https://kms-fips.us-west-2.amazonaws.com", // last values overrule earlier values!
];
const urlsLocal = ["local://tests/tmp/the-buck", "local://tests/tmp", ""];

// replace with the url you want to test
const url = urlsAmazon[7];
const storage = new Storage(url);

console.log(storage.introspect());
