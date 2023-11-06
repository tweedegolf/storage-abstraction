import "jasmine";
import { Storage } from "../src/Storage";
import { ConfigAmazonS3, StorageType } from "../src/types";

describe(`testing Amazon urls`, () => {
  // it("[0] no options", () => {
  //   const storage = new Storage("s3://key:secret/can/contain/slashes");
  //   expect(storage.getType()).toBe(StorageType.S3);
  //   expect(storage.getSelectedBucket()).toBe("");
  //   expect((storage.getConfiguration() as ConfigAmazonS3).accessKeyId).toBe("key");
  //   expect((storage.getConfiguration() as ConfigAmazonS3).secretAccessKey).toBe(
  //     "secret/can/contain/slashes"
  //   );
  //   expect((storage.getConfiguration() as ConfigAmazonS3).region).toBe("");
  // });

  it("[1] parameter string", () => {
    const storage = new Storage(
      "s3://key:secret/can/contain/slashes@eu-west-2/the-buck?sslEnabled=true"
    );
    // console.log((storage.getConfiguration() as ConfigAmazonS3));
    expect(storage.getType()).toBe(StorageType.S3);
    expect(storage.getSelectedBucket()).toBe("the-buck");
    expect((storage.getConfiguration() as ConfigAmazonS3).accessKeyId).toBe("key");
    expect((storage.getConfiguration() as ConfigAmazonS3).secretAccessKey).toBe(
      "secret/can/contain/slashes"
    );
    expect((storage.getConfiguration() as ConfigAmazonS3).region).toBe("eu-west-2");
    expect((storage.getConfiguration() as ConfigAmazonS3).sslEnabled as unknown as string).toBe(
      "true"
    );
  });

  // it("[2a] no region", () => {
  //   const storage = new Storage("s3://key:secret/can/contain/slashes@the-buck");
  //   expect(storage.getSelectedBucket()).toBe("the-buck");
  //   expect((storage.getConfiguration() as ConfigAmazonS3).region).toBe("");
  //   expect((storage.getConfiguration() as ConfigAmazonS3).bucketName).toBe("the-buck");
  // });

  // it("[2b] no region 2", () => {
  //   const storage = new Storage("s3://key:secret/can/contain/slashes@/the-buck");
  //   expect(storage.getSelectedBucket()).toBe("the-buck");
  //   expect((storage.getConfiguration() as ConfigAmazonS3).region).toBe("");
  //   expect((storage.getConfiguration() as ConfigAmazonS3).bucketName).toBe("the-buck");
  // });

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
    expect((storage.getConfiguration() as ConfigAmazonS3).accessKeyId).toBe("key");
    expect((storage.getConfiguration() as ConfigAmazonS3).secretAccessKey).toBe(
      "secret/can/contain/slashes"
    );
    expect((storage.getConfiguration() as ConfigAmazonS3).region).toBe("eu-west-2");
    expect((storage.getConfiguration() as ConfigAmazonS3).sslEnabled as unknown as string).toBe(
      "true"
    );
    expect((storage.getConfiguration() as ConfigAmazonS3).useDualStack as unknown).toBe(undefined);
    expect((storage.getConfiguration() as ConfigAmazonS3).nonExistentKey as string).toBe("true");
    expect((storage.getConfiguration() as ConfigAmazonS3).endpoint).toBe(undefined);
    expect((storage.getConfiguration() as ConfigAmazonS3).endPoint).toBe(
      "https://kms-fips.us-west-2.amazonaws.com"
    );
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
    expect((storage.getConfiguration() as ConfigAmazonS3).accessKeyId).toBe("key");
    expect((storage.getConfiguration() as ConfigAmazonS3).secretAccessKey).toBe(
      "secret/can/contain/slashes"
    );
    expect((storage.getConfiguration() as ConfigAmazonS3).region).toBe("eu-west-2");
    expect((storage.getConfiguration() as ConfigAmazonS3).sslEnabled).toBe(true);
  });

  it("[5] no bucket", () => {
    const storage = new Storage({
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
  //   expect((storage.getConfiguration() as ConfigAmazonS3).region).not.toBe("eu-west-2");
  // });

  it("[5a1] no bucket URL", () => {
    const storage = new Storage("s3://key:secret/can/contain/slashes@eu-west-2/");
    expect(storage.getSelectedBucket()).toBe("");
    expect((storage.getConfiguration() as ConfigAmazonS3).region).toBe("eu-west-2");
  });

  it("[5b] no bucket URL plus queryString", () => {
    const storage = new Storage("s3://key:secret/can/contain/slashes@eu-west-2/?sslEnabled=true");
    expect(storage.getSelectedBucket()).toBe("");
    expect((storage.getConfiguration() as ConfigAmazonS3).region).toBe("eu-west-2");
    expect((storage.getConfiguration() as ConfigAmazonS3).sslEnabled as unknown as string).toBe(
      "true"
    );
  });

  // it("[5b1] no bucket URL plus queryString", () => {
  //   const storage = new Storage("s3://key:secret/can/contain/slashes@eu-west-2?sslEnabled=true");
  //   expect(storage.getSelectedBucket()).toBe("eu-west-2");
  //   expect((storage.getConfiguration() as ConfigAmazonS3).region).not.toBe("eu-west-2");
  //   expect((storage.getConfiguration() as ConfigAmazonS3).sslEnabled).toBe(true);
  // });

  it("[6] number and boolean in config object keep their original type", () => {
    const storage = new Storage({
      type: "s3",
      region: "eu-west-2",
      accessKeyId: "key",
      secretAccessKey: "secret/can/contain/slashes",
      optionNumber: 42,
      optionBoolean: true,
    });
    expect((storage.getConfiguration() as ConfigAmazonS3).optionNumber).toBe(42);
    expect((storage.getConfiguration() as ConfigAmazonS3).optionBoolean).toBe(true);
  });

  it("[7] number and boolean used in config will stay string types", () => {
    const storage = new Storage(
      [
        "s3://key:secret/can/contain/slashes",
        "@eu-west-2/",
        "?optionNumber=42",
        "&optionBoolean=true",
      ].join("")
    );
    expect((storage.getConfiguration() as ConfigAmazonS3).optionNumber).toBe("42");
    expect((storage.getConfiguration() as ConfigAmazonS3).optionBoolean).toBe("true");
  });
});
