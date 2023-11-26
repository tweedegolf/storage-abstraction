import "jasmine";
import { Storage } from "../src/Storage";
import { AdapterAmazonS3 } from "../src/AdapterAmazonS3";
import { StorageType } from "../src/types";

describe(`testing Amazon urls`, () => {
  // it("[0] no options", () => {
  //   const storage = new Storage("s3://key:secret/can/contain/slashes");
  //   expect(storage.getType()).toBe(StorageType.S3);
  //   expect(storage.getSelectedBucket()).toBe("");
  //   expect(storage.config.accessKeyId).toBe("key");
  //   expect(storage.config.secretAccessKey).toBe(
  //     "secret/can/contain/slashes"
  //   );
  //   expect(storage.config.region).toBe("");
  // });

  it("[1] parameter string", () => {
    const storage = new AdapterAmazonS3(
      "s3://key:secret/can/contain/slashes@eu-west-2/the-buck?sslEnabled=true"
    );
    expect(storage.getType()).toBe(StorageType.S3);
    expect(storage.config.bucketName).toBe("the-buck");
    expect(storage.config.accessKeyId).toBe("key");
    expect(storage.config.secretAccessKey).toBe("secret/can/contain/slashes");
    expect(storage.config.region).toBe("eu-west-2");
    expect(storage.config.options?.sslEnabled as unknown as string).toBe("true");
  });

  // it("[2a] no region", () => {
  //   const storage = new Storage("s3://key:secret/can/contain/slashes@the-buck");
  //   expect(storage.getSelectedBucket()).toBe("the-buck");
  //   expect(storage.config.region).toBe("");
  //   expect(storage.config.bucketName).toBe("the-buck");
  // });

  // it("[2b] no region 2", () => {
  //   const storage = new Storage("s3://key:secret/can/contain/slashes@/the-buck");
  //   expect(storage.getSelectedBucket()).toBe("the-buck");
  //   expect(storage.config.region).toBe("");
  //   expect(storage.config.bucketName).toBe("the-buck");
  // });

  it("[3] non-existent keys will not be filtered anymore, nor will invalid typed values (e.g. a numeric value for useDualStack)", () => {
    const storage = new AdapterAmazonS3(
      [
        "s3://key:secret/can/contain/slashes@eu-west-2/the-buck",
        "?sslEnabled=true",
        "&useDualstack=23",
        "&otherExistentKey=true",
        "&endPoint=https://kms-fips.us-west-2.amazonaws.com", // note: endpoint should not be camel cased
      ].join("")
    );
    expect(storage.getType()).toBe(StorageType.S3);
    expect(storage.config.bucketName).toBe("the-buck");
    expect(storage.config.accessKeyId).toBe("key");
    expect(storage.config.secretAccessKey).toBe("secret/can/contain/slashes");
    expect(storage.config.region).toBe("eu-west-2");
    expect(storage.config.options?.sslEnabled as unknown as string).toBe("true");
    expect(storage.config.options?.useDualStack as unknown).toBe(undefined);
    expect(storage.config.options?.otherExistentKey as string).toBe("true");
    expect(storage.config.options?.endPoint).toBe("https://kms-fips.us-west-2.amazonaws.com");
    expect(storage.config.endpoint).toBe(undefined);
  });

  it("[4] object", () => {
    const storage = new AdapterAmazonS3({
      type: "s3",
      accessKeyId: "key",
      secretAccessKey: "secret/can/contain/slashes",
      region: "eu-west-2",
      bucketName: "the-buck",
      options: {
        sslEnabled: true,
      },
    });
    expect(storage.getType()).toBe(StorageType.S3);
    expect(storage.config.bucketName).toBe("the-buck");
    expect(storage.config.accessKeyId).toBe("key");
    expect(storage.config.secretAccessKey).toBe("secret/can/contain/slashes");
    expect(storage.config.region).toBe("eu-west-2");
    expect(storage.config.options?.sslEnabled).toBe(true);
  });

  it("[5] no bucket", () => {
    const storage = new AdapterAmazonS3({
      type: "s3",
      region: "eu-west-2",
      accessKeyId: "key",
      secretAccessKey: "secret/can/contain/slashes",
    });
    expect(storage.getSelectedBucket()).toBe("");
  });

  // it("[5a] no bucket URL", () => {
  //   const storage = new Storage("s3://key:secret/can/contain/slashes@eu-west-2");
  //   expect(storage.getSelectedBucket()).toBe("eu-west-2");
  //   expect(storage.config.region).not.toBe("eu-west-2");
  // });

  it("[5a1] no bucket URL", () => {
    const storage = new AdapterAmazonS3("s3://key:secret/can/contain/slashes@eu-west-2/");
    expect(storage.getSelectedBucket()).toBe("");
    expect(storage.config.region).toBe("eu-west-2");
  });

  it("[5b] no bucket URL plus queryString", () => {
    const storage = new AdapterAmazonS3(
      "s3://key:secret/can/contain/slashes@eu-west-2/?sslEnabled=true"
    );
    expect(storage.getSelectedBucket()).toBe("");
    expect(storage.config.region).toBe("eu-west-2");
    expect(storage.config.sslEnabled as unknown as string).toBe("true");
  });

  // it("[5b1] no bucket URL plus queryString", () => {
  //   const storage = new AdapterAmazonS3("s3://key:secret/can/contain/slashes@eu-west-2?sslEnabled=true");
  //   expect(storage.getSelectedBucket()).toBe("eu-west-2");
  //   expect(storage.config.region).not.toBe("eu-west-2");
  //   expect(storage.config.sslEnabled).toBe(true);
  // });

  it("[6] number and boolean in config object keep their original type", () => {
    const storage = new AdapterAmazonS3({
      type: "s3",
      region: "eu-west-2",
      accessKeyId: "key",
      secretAccessKey: "secret/can/contain/slashes",
      optionNumber: 42,
      optionBoolean: true,
    });
    expect(storage.config.optionNumber).toBe(42);
    expect(storage.config.optionBoolean).toBe(true);
  });

  it("[7] number and boolean used in config will stay string types", () => {
    const storage = new AdapterAmazonS3(
      [
        "s3://key:secret/can/contain/slashes",
        "@eu-west-2/",
        "?optionNumber=42",
        "&optionBoolean=true",
      ].join("")
    );
    expect(storage.config.optionNumber).toBe("42");
    expect(storage.config.optionBoolean).toBe("true");
  });
});
