import "jasmine";
import { Storage } from "../src/Storage";
import { StorageType } from "../src/types";

describe(`testing Amazon urls`, () => {
  it("[0] no options", () => {
    this.storage = new Storage("s3://key:secret/can/contain/slashes");
    expect(this.storage.getType()).toBe(StorageType.S3);
    expect(this.storage.getSelectedBucket()).toBe("");
    expect(this.storage.getConfiguration().accessKeyId).toBe("key");
    expect(this.storage.getConfiguration().secretAccessKey).toBe("secret/can/contain/slashes");
    expect(this.storage.getConfiguration().region).toBe("");
  });

  it("[1] parameter string", () => {
    this.storage = new Storage(
      "s3://key:secret/can/contain/slashes@eu-west-2/the-buck?sslEnabled=true"
    );
    // console.log(this.storage.getConfiguration());
    expect(this.storage.getType()).toBe(StorageType.S3);
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
    expect(this.storage.getConfiguration().accessKeyId).toBe("key");
    expect(this.storage.getConfiguration().secretAccessKey).toBe("secret/can/contain/slashes");
    expect(this.storage.getConfiguration().region).toBe("eu-west-2");
    expect(this.storage.getConfiguration().sslEnabled).toBe("true");
  });

  it("[2a] no region", () => {
    this.storage = new Storage("s3://key:secret/can/contain/slashes@the-buck");
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
    expect(this.storage.getConfiguration().region).toBe("");
    expect(this.storage.getConfiguration().bucketName).toBe("the-buck");
  });

  it("[2b] no region 2", () => {
    this.storage = new Storage("s3://key:secret/can/contain/slashes@/the-buck");
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
    expect(this.storage.getConfiguration().region).toBe("");
    expect(this.storage.getConfiguration().bucketName).toBe("the-buck");
  });

  it("[3] non-existent keys will not be filtered anymore, nor will invalid typed values (e.g. a numeric value for useDualStack)", () => {
    this.storage = new Storage(
      [
        "s3://key:secret/can/contain/slashes@eu-west-2/the-buck",
        "?sslEnabled=true",
        "&useDualstack=23",
        "&nonExistentKey=true",
        "&endPoint=https://kms-fips.us-west-2.amazonaws.com", // note: endpoint should not be camel cased
      ].join("")
    );
    expect(this.storage.getType()).toBe(StorageType.S3);
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
    expect(this.storage.getConfiguration().accessKeyId).toBe("key");
    expect(this.storage.getConfiguration().secretAccessKey).toBe("secret/can/contain/slashes");
    expect(this.storage.getConfiguration().region).toBe("eu-west-2");
    expect(this.storage.getConfiguration().sslEnabled).toBe("true");
    expect(this.storage.getConfiguration().useDualStack).toBe(undefined);
    expect(this.storage.getConfiguration().nonExistentKey).toBe("true");
    expect(this.storage.getConfiguration().endpoint).toBe(undefined);
    expect(this.storage.getConfiguration().endPoint).toBe(
      "https://kms-fips.us-west-2.amazonaws.com"
    );
  });

  it("[4] object", () => {
    this.storage = new Storage({
      type: "s3",
      accessKeyId: "key",
      secretAccessKey: "secret/can/contain/slashes",
      region: "eu-west-2",
      bucketName: "the-buck",
      sslEnabled: true,
    });
    expect(this.storage.getType()).toBe(StorageType.S3);
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
    expect(this.storage.getConfiguration().accessKeyId).toBe("key");
    expect(this.storage.getConfiguration().secretAccessKey).toBe("secret/can/contain/slashes");
    expect(this.storage.getConfiguration().region).toBe("eu-west-2");
    expect(this.storage.getConfiguration().sslEnabled).toBe(true);
  });

  it("[5] no bucket", () => {
    this.storage = new Storage({
      type: "s3",
      accessKeyId: "key",
      secretAccessKey: "secret/can/contain/slashes",
    });
    expect(this.storage.getSelectedBucket()).toBe("");
  });

  it("[5a] no bucket URL", () => {
    this.storage = new Storage("s3://key:secret/can/contain/slashes@eu-west-2");
    expect(this.storage.getSelectedBucket()).toBe("eu-west-2");
    expect(this.storage.getConfiguration().region).not.toBe("eu-west-2");
  });

  it("[5a1] no bucket URL", () => {
    this.storage = new Storage("s3://key:secret/can/contain/slashes@eu-west-2/");
    expect(this.storage.getSelectedBucket()).toBe("");
    expect(this.storage.getConfiguration().region).toBe("eu-west-2");
  });

  it("[5b] no bucket URL plus queryString", () => {
    this.storage = new Storage("s3://key:secret/can/contain/slashes@eu-west-2/?sslEnabled=true");
    expect(this.storage.getSelectedBucket()).toBe("");
    expect(this.storage.getConfiguration().region).toBe("eu-west-2");
    expect(this.storage.getConfiguration().sslEnabled).toBe("true");
  });

  it("[5b1] no bucket URL plus queryString", () => {
    this.storage = new Storage("s3://key:secret/can/contain/slashes@eu-west-2?sslEnabled=true");
    expect(this.storage.getSelectedBucket()).toBe("eu-west-2");
    expect(this.storage.getConfiguration().region).not.toBe("eu-west-2");
    expect(this.storage.getConfiguration().sslEnabled).toBe("true");
  });

  it("[6] number and boolean in config object keep their original type", () => {
    this.storage = new Storage({
      type: "s3",
      accessKeyId: "key",
      secretAccessKey: "secret/can/contain/slashes",
      optionNumber: 42,
      optionBoolean: true,
    });
    expect(this.storage.getConfiguration().optionNumber).toBe(42);
    expect(this.storage.getConfiguration().optionBoolean).toBe(true);
  });

  it("[7] number and boolean used in config will stay string types", () => {
    this.storage = new Storage(
      ["s3://key:secret/can/contain/slashes", "?optionNumber=42", "&optionBoolean=true"].join("")
    );
    expect(this.storage.getConfiguration().optionNumber).toBe("42");
    expect(this.storage.getConfiguration().optionBoolean).toBe("true");
  });
});
