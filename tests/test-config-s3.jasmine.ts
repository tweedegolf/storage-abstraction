import "jasmine";
import { Storage } from "../src/Storage";
import { ConfigAmazonS3, StorageType } from "../src/types";

describe(`testing Amazon urls`, () => {
  it("[0] no options", () => {
    const storage = new Storage("s3://key:secret/can/contain/slashes");
    expect(storage.getType()).toBe(StorageType.S3);
    expect(storage.getSelectedBucket()).toBe("");
    const config = storage.getConfiguration() as ConfigAmazonS3;
    expect(config.accessKeyId).toBe("key");
    expect(config.secretAccessKey).toBe("secret/can/contain/slashes");
    expect(config.region).toBe("");
  });

  it("[1] parameter string", () => {
    const storage = new Storage(
      "s3://key:secret/can/contain/slashes@eu-west-2/the-buck?sslEnabled=true"
    );
    expect(storage.getType()).toBe(StorageType.S3);
    expect(storage.getSelectedBucket()).toBe("the-buck");
    const config = storage.getConfiguration() as ConfigAmazonS3;
    console.log(config, config.sslEnabled, config.sslEnabled === true);
    expect(config.accessKeyId).toBe("key");
    expect(config.secretAccessKey).toBe("secret/can/contain/slashes");
    expect(config.region).toBe("eu-west-2");
    expect(config.sslEnabled).toBe(true);
  });

  it("[2a] no region", () => {
    const storage = new Storage("s3://key:secret/can/contain/slashes@the-buck");
    expect(storage.getSelectedBucket()).toBe("the-buck");
    const config = storage.getConfiguration() as ConfigAmazonS3;
    expect(config.region).toBe("");
    expect(config.bucketName).toBe("the-buck");
  });

  it("[2b] no region 2", () => {
    const storage = new Storage("s3://key:secret/can/contain/slashes@/the-buck");
    expect(storage.getSelectedBucket()).toBe("the-buck");
    const config = storage.getConfiguration() as ConfigAmazonS3;
    expect(config.region).toBe("");
    expect(config.bucketName).toBe("the-buck");
  });

  it("[3] non-existent keys will not be filtered anymore, nor will invalid typed values (e.g. a numeric value for useDualStack)", () => {
    const storage = new Storage(
      [
        "s3://key:secret/can/contain/slashes@eu-west-2/the-buck",
        "?sslEnabled=true",
        "&useDualstack=23",
        "&nonExistentKey=true",
        "&endPoint=https://kms-fips.us-west-2.amazonaws.com", // note: endpoint should not be camel cased
      ].join("")
    );
    expect(storage.getType()).toBe(StorageType.S3);
    expect(storage.getSelectedBucket()).toBe("the-buck");
    const config = storage.getConfiguration() as ConfigAmazonS3;
    expect(config.accessKeyId).toBe("key");
    expect(config.secretAccessKey).toBe("secret/can/contain/slashes");
    expect(config.region).toBe("eu-west-2");
    expect(config.sslEnabled).toBe(true);
    expect(config.useDualStack).toBe(undefined);
    expect(config.nonExistentKey).toBe(true);
    expect(config.endpoint).toBe(undefined);
    expect(config.endPoint).toBe("https://kms-fips.us-west-2.amazonaws.com");
  });

  it("[4] object", () => {
    const storage = new Storage({
      type: "s3",
      accessKeyId: "key",
      secretAccessKey: "secret/can/contain/slashes",
      region: "eu-west-2",
      bucketName: "the-buck",
      sslEnabled: true,
    });
    expect(storage.getType()).toBe(StorageType.S3);
    expect(storage.getSelectedBucket()).toBe("the-buck");
    const config = storage.getConfiguration() as ConfigAmazonS3;
    expect(config.accessKeyId).toBe("key");
    expect(config.secretAccessKey).toBe("secret/can/contain/slashes");
    expect(config.region).toBe("eu-west-2");
    expect(config.sslEnabled).toBe(true);
  });

  it("[5] no bucket", () => {
    const storage = new Storage({
      type: "s3",
      accessKeyId: "key",
      secretAccessKey: "secret/can/contain/slashes",
    });
    expect(storage.getSelectedBucket()).toBe("");
  });

  it("[5a] no bucket URL", () => {
    const storage = new Storage("s3://key:secret/can/contain/slashes@eu-west-2");
    expect(storage.getSelectedBucket()).toBe("eu-west-2");
    const config = storage.getConfiguration() as ConfigAmazonS3;
    expect(config.region).not.toBe("eu-west-2");
  });

  it("[5a1] no bucket URL", () => {
    const storage = new Storage("s3://key:secret/can/contain/slashes@eu-west-2/");
    expect(storage.getSelectedBucket()).toBe("");
    const config = storage.getConfiguration() as ConfigAmazonS3;
    expect(config.region).toBe("eu-west-2");
  });

  it("[5b] no bucket URL plus queryString", () => {
    const storage = new Storage("s3://key:secret/can/contain/slashes@eu-west-2/?sslEnabled=true");
    expect(storage.getSelectedBucket()).toBe("");
    const config = storage.getConfiguration() as ConfigAmazonS3;
    expect(config.region).toBe("eu-west-2");
    expect(config.sslEnabled).toBe(true);
  });

  it("[5b1] no bucket URL plus queryString", () => {
    const storage = new Storage("s3://key:secret/can/contain/slashes@eu-west-2?sslEnabled=true");
    expect(storage.getSelectedBucket()).toBe("eu-west-2");
    const config = storage.getConfiguration() as ConfigAmazonS3;
    expect(config.region).not.toBe("eu-west-2");
    expect(config.sslEnabled).toBe(true);
  });

  it("[6] number and boolean in config object keep their original type", () => {
    const storage = new Storage({
      type: "s3",
      accessKeyId: "key",
      secretAccessKey: "secret/can/contain/slashes",
      optionNumber: 42,
      optionBoolean: true,
    });
    const config = storage.getConfiguration() as ConfigAmazonS3;
    expect(config.optionNumber).toBe(42);
    expect(config.optionBoolean).toBe(true);
  });

  it("[7] number and boolean used in config will stay string types", () => {
    const storage = new Storage(
      ["s3://key:secret/can/contain/slashes", "?optionNumber=42", "&optionBoolean=true"].join("")
    );
    const config = storage.getConfiguration() as ConfigAmazonS3;
    expect(config.optionNumber).toBe("42");
    expect(config.optionBoolean).toBe(true);
  });
});
