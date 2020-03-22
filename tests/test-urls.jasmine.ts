import "jasmine";
import { Storage } from "../src/Storage";
import { StorageType } from "../src/types";

describe(`testing Google urls`, () => {
  it("[0]", () => {
    this.storage = new Storage("gcs://keyFile.json:appName/the-buck");
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("the-buck");
    expect(this.storage.introspect("projectId")).toBe("appName");
    expect(this.storage.introspect("keyFilename")).toBe("keyFile.json");
  });

  it("[1]", () => {
    this.storage = new Storage("gcs://keyFile.json:appName/");
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("");
    expect(this.storage.introspect("projectId")).toBe("appName");
    expect(this.storage.introspect("keyFilename")).toBe("keyFile.json");
  });

  it("[2]", () => {
    this.storage = new Storage("gcs://keyFile.json:appName");
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("");
    expect(this.storage.introspect("projectId")).toBe("appName");
    expect(this.storage.introspect("keyFilename")).toBe("keyFile.json");
  });

  it("[3]", () => {
    this.storage = new Storage("gcs://tests/keyFile.json/the-buck");
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("the-buck");
    expect(this.storage.introspect("projectId")).toBe("appIdFromTestFile");
    expect(this.storage.introspect("keyFilename")).toBe("tests/keyFile.json");
  });

  it("[4]", () => {
    this.storage = new Storage("gcs://tests/keyFile.json/");
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("");
    expect(this.storage.introspect("projectId")).toBe("appIdFromTestFile");
    expect(this.storage.introspect("keyFilename")).toBe("tests/keyFile.json");
  });

  it("[5]", () => {
    this.storage = new Storage("gcs://keyFile.json");
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("");
    expect(this.storage.introspect("projectId")).toBe("appIdFromTestFile");
    expect(this.storage.introspect("keyFilename")).toBe("keyFile.json");
  });
});

describe(`testing Amazon urls`, () => {
  it("[0] no options", () => {
    this.storage = new Storage("s3://key:secret/can/contain/slashes");
    expect(this.storage.introspect("type")).toBe(StorageType.S3);
    expect(this.storage.introspect("accessKeyId")).toBe("key present but hidden");
    expect(this.storage.introspect("secretAccessKey")).toBe("secret present but hidden");
    expect(this.storage.introspect("region")).toBe("");
    expect(this.storage.introspect("bucketName")).toBe("");
  });

  it("[1] parameter string", () => {
    this.storage = new Storage(
      "s3://key:secret/can/contain/slashes?region=eu-west-2&bucketName=the-buck&sslEnabled=true"
    );
    expect(this.storage.introspect("type")).toBe(StorageType.S3);
    expect(this.storage.introspect("accessKeyId")).toBe("key present but hidden");
    expect(this.storage.introspect("secretAccessKey")).toBe("secret present but hidden");
    expect(this.storage.introspect("region")).toBe("eu-west-2");
    expect(this.storage.introspect("bucketName")).toBe("the-buck");
    expect(this.storage.introspect("sslEnabled")).toBe(true);
  });

  it("[2] typo", () => {
    this.storage = new Storage("s3://key:secret/can/contain/slashes?buckeName=the-buck");
    expect(this.storage.introspect("type")).toBe(StorageType.S3);
    expect(this.storage.introspect("accessKeyId")).toBe("key present but hidden");
    expect(this.storage.introspect("secretAccessKey")).toBe("secret present but hidden");
    expect(this.storage.introspect("region")).toBe("");
    expect(this.storage.introspect("bucketName")).toBe("");
  });

  it("[3] non-existent keys and key with wrong value types", () => {
    this.storage = new Storage(
      [
        "s3://key:secret/can/contain/slashes",
        "?region=eu-west-2",
        "&bucketName=the-buck",
        "&sslEnabled=true",
        "&useDualstack=23",
        "&nonExistentKey=true",
        "&endPoint=https://kms-fips.us-west-2.amazonaws.com", // note: endpoint should not be camel cased
      ].join("")
    );
    expect(this.storage.introspect("type")).toBe(StorageType.S3);
    expect(this.storage.introspect("accessKeyId")).toBe("key present but hidden");
    expect(this.storage.introspect("secretAccessKey")).toBe("secret present but hidden");
    expect(this.storage.introspect("region")).toBe("eu-west-2");
    expect(this.storage.introspect("bucketName")).toBe("the-buck");
    expect(this.storage.introspect("sslEnabled")).toBe(true);
    expect(this.storage.introspect("useDualStack")).toBe(undefined);
    expect(this.storage.introspect("nonExistentKey")).toBe(undefined);
    expect(this.storage.introspect("endpoint")).toBe(undefined);
    expect(this.storage.introspect("endPoint")).toBe(undefined);
  });

  it("[4] using @ urls", () => {
    this.storage = new Storage(
      "s3://key:secret/can/contain/slashes@eu-west-2/the-buck?sslEnabled=true&endpoint=https://kms-fips.us-west-2.amazonaws.com"
    );
    expect(this.storage.introspect("type")).toBe(StorageType.S3);
    expect(this.storage.introspect("accessKeyId")).toBe("key present but hidden");
    expect(this.storage.introspect("secretAccessKey")).toBe("secret present but hidden");
    expect(this.storage.introspect("region")).toBe("eu-west-2");
    expect(this.storage.introspect("bucketName")).toBe("the-buck");
    expect(this.storage.introspect("sslEnabled")).toBe(true);
    expect(this.storage.introspect("endpoint")).toBe("https://kms-fips.us-west-2.amazonaws.com");
  });

  it("[5] using @ urls - no region", () => {
    this.storage = new Storage(
      "s3://key:secret/can/contain/slashes@/the-buck?sslEnabled=true&endpoint=https://kms-fips.us-west-2.amazonaws.com"
    );
    expect(this.storage.introspect("type")).toBe(StorageType.S3);
    expect(this.storage.introspect("accessKeyId")).toBe("key present but hidden");
    expect(this.storage.introspect("secretAccessKey")).toBe("secret present but hidden");
    expect(this.storage.introspect("region")).toBe("");
    expect(this.storage.introspect("bucketName")).toBe("the-buck");
    expect(this.storage.introspect("sslEnabled")).toBe(true);
    expect(this.storage.introspect("endpoint")).toBe("https://kms-fips.us-west-2.amazonaws.com");
  });

  it("[6] using @ urls - no region error", () => {
    this.storage = new Storage(
      "s3://key:secret/can/contain/slashes@the-buck?sslEnabled=true&endpoint=https://kms-fips.us-west-2.amazonaws.com"
    );
    expect(this.storage.introspect("type")).toBe(StorageType.S3);
    expect(this.storage.introspect("accessKeyId")).toBe("key present but hidden");
    expect(this.storage.introspect("secretAccessKey")).toBe("secret present but hidden");
    expect(this.storage.introspect("region")).toBe("the-buck?sslEnabled=true&endpoint=https:");
    expect(this.storage.introspect("bucketName")).toBe("?sslEnabled=true&endpoint=https:/");
  });

  it("[7] using @ urls - no region error 2", () => {
    this.storage = new Storage("s3://key:secret/can/contain/slashes/the-buck?sslEnabled=true");
    expect(this.storage.introspect("type")).toBe(StorageType.S3);
    expect(this.storage.introspect("accessKeyId")).toBe("key present but hidden");
    expect(this.storage.introspect("secretAccessKey")).toBe("secret present but hidden");
    expect(this.storage.introspect("region")).toBe("");
    expect(this.storage.introspect("bucketName")).toBe("");
  });

  it("[8] using @ urls - parameter string values overrule @ values", () => {
    this.storage = new Storage(
      "s3://key:secret/can/contain/slashes@us-east-1/not-here?region=eu-west-2&bucketName=the-buck"
    );
    expect(this.storage.introspect("type")).toBe(StorageType.S3);
    expect(this.storage.introspect("accessKeyId")).toBe("key present but hidden");
    expect(this.storage.introspect("secretAccessKey")).toBe("secret present but hidden");
    expect(this.storage.introspect("region")).toBe("eu-west-2");
    expect(this.storage.introspect("bucketName")).toBe("the-buck");
  });
});

describe(`testing local urls`, () => {
  it("[0]", () => {
    this.storage = new Storage("local://tests/tmp/the-buck");
    expect(this.storage.introspect("type")).toBe(StorageType.LOCAL);
    expect(this.storage.introspect("directory")).toBe("tests/tmp/");
    expect(this.storage.introspect("bucketName")).toBe("the-buck");
  });

  it("[1]", () => {
    this.storage = new Storage("local://tests/tmp");
    expect(this.storage.introspect("type")).toBe(StorageType.LOCAL);
    expect(this.storage.introspect("directory")).toBe("tests/");
    expect(this.storage.introspect("bucketName")).toBe("tmp");
  });

  it("[2] no config", () => {
    this.storage = new Storage();
    expect(this.storage.introspect("type")).toBe(StorageType.LOCAL);
    expect(this.storage.introspect("directory")).toBe("/tmp/");
    expect(this.storage.introspect("bucketName")).toBe("local-bucket");
  });
});
