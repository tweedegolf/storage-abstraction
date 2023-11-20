import "jasmine";
import { ConfigBackblazeB2, StorageType } from "../src/types";
import { AdapterBackblazeB2 } from "../src/AdapterBackblazeB2";

describe(`testing backblaze b2 urls`, () => {
  it("[0]", () => {
    const storage = new AdapterBackblazeB2(
      "b2://application-key-id:application-key/can/contain/slashes"
    );
    expect(storage.getType()).toBe(StorageType.B2);
    expect(storage.config.bucketName).toBe("");
    expect((storage.config as ConfigBackblazeB2).applicationKeyId).toBe("application-key-id");
    expect((storage.config as ConfigBackblazeB2).applicationKey).toBe(
      "application-key/can/contain/slashes"
    );
  });

  it("[1]", () => {
    const storage = new AdapterBackblazeB2(
      "b2://application-key-id:application-key/can/contain/slashes@the-buck"
    );
    expect(storage.getType()).toBe(StorageType.B2);
    expect(storage.config.bucketName).toBe("the-buck");
  });

  it("[2a] object", () => {
    const storage = new AdapterBackblazeB2({
      type: StorageType.B2,
      applicationKeyId: "keyId",
      applicationKey: "key",
    });
    expect(storage.getType()).toBe(StorageType.B2);
    expect(storage.config.bucketName).toBe(undefined);
  });

  it("[2b] object", () => {
    const storage = new AdapterBackblazeB2({
      type: StorageType.B2,
      applicationKeyId: "keyId",
      applicationKey: "key",
      bucketName: "bucket",
    });
    expect(storage.getType()).toBe(StorageType.B2);
    expect(storage.config.bucketName).toBe("bucket");
    expect((storage.getConfiguration() as ConfigBackblazeB2).applicationKeyId).toBe("keyId");
    expect((storage.getConfiguration() as ConfigBackblazeB2).applicationKey).toBe("key");
  });
});
