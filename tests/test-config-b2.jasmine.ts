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
      "b2://application-key-id:application-key/can/contain/slashes?bucketName=the-buck"
    );
    expect(this.storage.getType()).toBe(StorageType.B2);
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
  });

  it("[2] store in folder where process runs", () => {
    this.storage = new Storage(
      "b2://application-key-id:application-key/can/contain/slashes?bucketName=the buck"
    );
    expect(this.storage.getType()).toBe(StorageType.B2);
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
  });
});
