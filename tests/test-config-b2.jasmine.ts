import "jasmine";
import { Storage } from "../src/Storage";
import { ConfigBackblazeB2, StorageType } from "../src/types";

describe(`testing backblaze b2 urls`, () => {
  it("[0]", () => {
    const storage = new Storage("b2://application-key-id:application-key/can/contain/slashes");
    expect(storage.getType()).toBe(StorageType.B2);
    expect(storage.getSelectedBucket()).toBe("");
    expect((storage.getConfiguration() as ConfigBackblazeB2).applicationKeyId).toBe(
      "application-key-id"
    );
    expect((storage.getConfiguration() as ConfigBackblazeB2).applicationKey).toBe(
      "application-key/can/contain/slashes"
    );
  });

  it("[1]", () => {
    const storage = new Storage(
      "b2://application-key-id:application-key/can/contain/slashes@the-buck"
    );
    expect(storage.getType()).toBe(StorageType.B2);
    expect(storage.getSelectedBucket()).toBe("the-buck");
  });

  it("[2a] object", () => {
    const storage = new Storage({
      type: StorageType.B2,
      applicationKeyId: "keyId",
      applicationKey: "key",
    });
    expect(storage.getType()).toBe(StorageType.B2);
    expect(storage.getSelectedBucket()).toBe("");
  });

  it("[2b] object", () => {
    const storage = new Storage({
      type: StorageType.B2,
      applicationKeyId: "keyId",
      applicationKey: "key",
      bucketName: "bucket",
    });
    expect(storage.getType()).toBe(StorageType.B2);
    expect(storage.getSelectedBucket()).toBe("bucket");
    expect((storage.getConfiguration() as ConfigBackblazeB2).applicationKeyId).toBe("keyId");
    expect((storage.getConfiguration() as ConfigBackblazeB2).applicationKey).toBe("key");
  });
});
