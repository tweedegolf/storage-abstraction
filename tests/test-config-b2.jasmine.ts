import "jasmine";
import { Storage } from "../src/Storage";
import { StorageType } from "../src/types";

describe(`testing backblaze b2 urls`, () => {
  it("[0]", () => {
    this.storage = new Storage("b2://application-key-id:application-key/can/contain/slashes");
    expect(this.storage.getType()).toBe(StorageType.B2);
    expect(this.storage.getSelectedBucket()).toBe("");
    expect(this.storage.getConfiguration().applicationKeyId).toBe("application-key-id");
    expect(this.storage.getConfiguration().applicationKey).toBe(
      "application-key/can/contain/slashes"
    );
  });

  it("[1]", () => {
    this.storage = new Storage(
      "b2://application-key-id:application-key/can/contain/slashes@the-buck"
    );
    expect(this.storage.getType()).toBe(StorageType.B2);
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
  });

  it("[2a] slug is true by default", () => {
    this.storage = new Storage(
      "b2://application-key-id:application-key/can/contain/slashes@the buck"
    );
    expect(this.storage.getType()).toBe(StorageType.B2);
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
  });

  it("[2b] slug is true by default", () => {
    this.storage = new Storage(
      "b2://application-key-id:application-key/can/contain/slashes@the buck?slug=false"
    );
    expect(this.storage.getType()).toBe(StorageType.B2);
    expect(this.storage.getSelectedBucket()).toBe("the buck"); // not recommended!
  });

  it("[3a] object", () => {
    this.storage = new Storage({
      type: StorageType.B2,
      applicationKeyId: "keyId",
      applicationKey: "key",
    });
    expect(this.storage.getType()).toBe(StorageType.B2);
    expect(this.storage.getSelectedBucket()).toBe("");
  });

  it("[3b] object", () => {
    this.storage = new Storage({
      type: StorageType.B2,
      applicationKeyId: "keyId",
      applicationKey: "key",
      bucketName: "bucket",
    });
    expect(this.storage.getType()).toBe(StorageType.B2);
    expect(this.storage.getSelectedBucket()).toBe("bucket");
    expect(this.storage.getConfiguration().applicationKeyId).toBe("keyId");
    expect(this.storage.getConfiguration().applicationKey).toBe("key");
  });
});
